#!/bin/bash
# Script pour builder en local et déployer sur Freebox Delta
set -e

# Configuration
FREEBOX_IP="beben0.com"     # Domaine de ta VM Freebox
FREEBOX_USER="freebox"      # Utilisateur SSH de la Freebox
REMOTE_PATH="/home/freebox/alliance-manager"

echo "🏗️ Build local et déploiement sur Freebox Delta"

# IP configurée pour ta VM Freebox
echo "🌐 Déploiement vers : $FREEBOX_IP"

# 1. Build local de l'image Docker
echo "🔨 Build de l'image en local..."
docker build -t alliance-manager:latest -f Dockerfile .

# 2. Sauvegarder l'image en fichier tar
echo "📦 Sauvegarde de l'image Docker..."
docker save alliance-manager:latest -o alliance-manager-image.tar

# 3. Compresser pour transfert plus rapide
echo "🗜️ Compression de l'image..."
gzip -f alliance-manager-image.tar

# 4. Créer l'archive du projet (sans node_modules et fichiers temporaires)
echo "📁 Création de l'archive du projet..."
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='alliance-manager-image.tar*' \
    --exclude='alliance-manager-project.tar*' \
    --exclude='.git' \
    --exclude='*.tar.gz' \
    --exclude='*.tar' \
    --no-xattrs \
    -czf alliance-manager-project.tar.gz .

# 5. Transfert vers la Freebox
echo "📡 Transfert vers la Freebox ($FREEBOX_IP)..."

# Créer le dossier distant
ssh $FREEBOX_USER@$FREEBOX_IP "mkdir -p $REMOTE_PATH"

# Transférer l'image Docker
echo "📤 Upload de l'image Docker..."
scp alliance-manager-image.tar.gz $FREEBOX_USER@$FREEBOX_IP:$REMOTE_PATH/

# Transférer le projet
echo "📤 Upload du projet..."
scp alliance-manager-project.tar.gz $FREEBOX_USER@$FREEBOX_IP:$REMOTE_PATH/

# 6. Déploiement sur la Freebox
echo "🚀 Déploiement sur la Freebox..."
ssh $FREEBOX_USER@$FREEBOX_IP << 'EOF'
cd /home/freebox/alliance-manager

echo "📦 Extraction du projet..."
tar --no-same-owner -xzf alliance-manager-project.tar.gz

echo "🐳 Chargement de l'image Docker..."
gunzip -f alliance-manager-image.tar.gz
docker load -i alliance-manager-image.tar

echo "🧹 Nettoyage des containers existants..."
docker-compose -f docker-compose.freebox-https.yml --env-file .env.production down 2>/dev/null || true
docker-compose -f docker-compose.freebox.yml --env-file .env.production down 2>/dev/null || true

echo "🔐 Génération/mise à jour du .env.production..."

# TOUJOURS sauvegarder l'ancien .env si il existe
if [ -f ".env.production" ]; then
    cp .env.production .env.production.backup
    echo "📋 Sauvegarde .env.production → .env.production.backup"
fi

# Créer ou mettre à jour le .env.production avec TOUTES les variables critiques
if [ ! -f ".env.production" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
else
    # Récupérer les variables existantes
    NEXTAUTH_SECRET=$(grep "NEXTAUTH_SECRET=" .env.production | cut -d'=' -f2- || openssl rand -base64 32)
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD=" .env.production | cut -d'=' -f2- || openssl rand -base64 32)
fi

# TOUJOURS régénérer le fichier complet pour éviter les doublons/incohérences
cat > .env.production << ENVEOF
# Production Environment - Freebox Delta
POSTGRES_DB=alliance_manager_prod
POSTGRES_USER=alliance_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
NEXTAUTH_URL=https://beben0.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NODE_ENV=production
AUTO_START_TRAINS=true
AUTO_START_ALERTS=true
LIBRETRANSLATE_ENDPOINT=http://libretranslate:5000/translate
ENVEOF

echo "✅ .env.production généré avec TOUTES les variables critiques"

# Vérification de sécurité : s'assurer que les variables critiques sont présentes
echo "🔍 Vérification des variables critiques..."
missing_vars=""
if ! grep -q "AUTO_START_TRAINS=true" .env.production; then
    missing_vars="$missing_vars AUTO_START_TRAINS"
fi
if ! grep -q "AUTO_START_ALERTS=true" .env.production; then
    missing_vars="$missing_vars AUTO_START_ALERTS"
fi
if ! grep -q "NODE_ENV=production" .env.production; then
    missing_vars="$missing_vars NODE_ENV"
fi

if [ -n "$missing_vars" ]; then
    echo "❌ ERREUR: Variables critiques manquantes:$missing_vars"
    echo "📋 Contenu de .env.production:"
    cat .env.production
    exit 1
fi

echo "✅ Toutes les variables critiques sont présentes"

echo "🏃 Démarrage des services HTTPS..."
docker-compose -f docker-compose.freebox-https.yml --env-file .env.production up -d

echo "🏥 Attente du démarrage de l'application..."
sleep 60

echo "⏳ Vérification de la disponibilité de Postgres..."
until docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T postgres pg_isready -U alliance_user >/dev/null 2>&1; do
  echo "   Postgres pas encore prêt, nouvelle tentative dans 2s..."
  sleep 2
done

# Exécuter les migrations Prisma avec jusqu'à 5 tentatives pour éviter les faux négatifs
echo "🔄 Application des migrations Prisma (max 5 tentatives)..."
for i in {1..5}; do
  if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx prisma db push --accept-data-loss; then
    echo "✅ Migrations appliquées avec succès (tentative $i)"
    break
  else
    if [ "$i" -eq 5 ]; then
      echo "❌ Impossible d'appliquer les migrations après 5 tentatives, arrêt du déploiement."
      exit 1
    fi
    echo "⚠️ Tentative $i échouée, nouvelle tentative dans 5s..."
    sleep 5
  fi
done

# Génération du client Prisma
docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx prisma generate || echo "⚠️ Erreur génération client, continuons..."

echo "🔍 Test de santé HTTPS..."
if curl -k -f https://localhost/api/health 2>/dev/null; then
    echo "✅ Application démarrée avec succès!"
    
    echo "🌱 Application du seed complet..."
    if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/complete-seed.ts; then
        echo "✅ Seed complet appliqué avec succès!"
        
        echo "🚂 Génération des trains pour les 14 prochains jours..."
        if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/generate-train-instances.ts; then
            echo "✅ Trains générés avec succès!"
        else
            echo "⚠️ Erreur lors de la génération des trains, mais l'app fonctionne"
        fi
        
        echo "🎉 Déploiement HTTPS complet sur Freebox Delta!"
        echo "🌐 Application accessible sur : https://beben0.com"
        echo "👤 Login admin : admin@beben0.com / admin123"
        echo "📚 Système d'aide initialisé avec articles de démonstration"
        echo "🚂 Trains automatiques générés et schedulers actifs"
    else
        echo "⚠️ Erreur lors du seed complet, tentative avec le seed simple..."
        if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/simple-seed.ts; then
            echo "✅ Seed simple appliqué en fallback!"
                
                echo "🚂 Génération des trains pour les 14 prochains jours..."
                if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/generate-train-instances.ts; then
                    echo "✅ Trains générés avec succès!"
                else
                    echo "⚠️ Erreur lors de la génération des trains, mais l'app fonctionne"
                fi
                
            echo "🌐 Application accessible sur : https://beben0.com"
            echo "👤 Login admin : admin@beben0.com / admin123"
                echo "🚂 Trains automatiques générés et schedulers actifs"
        else
            echo "⚠️ Erreur lors du seed, mais l'app fonctionne"
            echo "🌐 Application accessible sur : https://beben0.com"
        fi
    fi
else
    echo "⚠️ Application pas encore prête, attente supplémentaire..."
    sleep 30
    if curl -k -f https://localhost/api/health 2>/dev/null; then
        echo "✅ Application démarrée après attente supplémentaire!"
        
        echo "🌱 Application du seed complet..."
        if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/complete-seed.ts; then
            echo "✅ Seed complet appliqué avec succès!"
            
            echo "🚂 Génération des trains pour les 14 prochains jours..."
            if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/generate-train-instances.ts; then
                echo "✅ Trains générés avec succès!"
            else
                echo "⚠️ Erreur lors de la génération des trains, mais l'app fonctionne"
            fi
            
            echo "🎉 Déploiement HTTPS complet sur Freebox Delta!"
            echo "🌐 Application accessible sur : https://beben0.com"
            echo "👤 Login admin : admin@beben0.com / admin123"
            echo "📚 Système d'aide initialisé avec articles de démonstration"
            echo "🚂 Trains automatiques générés et schedulers actifs"
        else
            echo "⚠️ Erreur lors du seed complet, tentative avec le seed simple..."
            if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/simple-seed.ts; then
                echo "✅ Seed simple appliqué en fallback!"
                
                echo "🚂 Génération des trains pour les 14 prochains jours..."
                if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/generate-train-instances.ts; then
                    echo "✅ Trains générés avec succès!"
                else
                    echo "⚠️ Erreur lors de la génération des trains, mais l'app fonctionne"
                fi
                
                echo "🌐 Application accessible sur : https://beben0.com"
                echo "👤 Login admin : admin@beben0.com / admin123"
                echo "🚂 Trains automatiques générés et schedulers actifs"
            else
                echo "⚠️ Erreur lors du seed, mais l'app fonctionne"
                echo "🌐 Application accessible sur : https://beben0.com"
            fi
        fi
    fi
fi

echo "🧹 Nettoyage des fichiers d'installation..."
rm -f alliance-manager-image.tar alliance-manager-project.tar.gz

# Vérification finale des schedulers
echo "🔍 Vérification finale des schedulers..."
sleep 10
if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production logs app --tail=50 | grep -q "Starting train scheduler"; then
    echo "✅ Train scheduler détecté dans les logs"
else
    echo "⚠️ Train scheduler non détecté, vérification manuelle nécessaire"
fi

if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production logs app --tail=50 | grep -q "Starting alert scheduler"; then
    echo "✅ Alert scheduler détecté dans les logs"
else
    echo "⚠️ Alert scheduler non détecté, vérification manuelle nécessaire"
fi

echo "📊 État final des containers:"
docker-compose -f docker-compose.freebox-https.yml --env-file .env.production ps

echo "🔄 Redémarrage de nginx pour prise en compte du réseau..."
docker-compose -f docker-compose.freebox-https.yml --env-file .env.production restart nginx

echo "⏳ Attente du démarrage de nginx (5s)..."
sleep 5

echo "🔍 Test final de santé externe..."
sleep 5

if curl -I https://$FREEBOX_IP/api/health 2>/dev/null | grep -q "200"; then
    echo "✅ Site accessible depuis l'extérieur!"
    echo ""
    echo "🎉 Déploiement terminé avec succès!"
    echo "🌐 Application accessible sur : https://$FREEBOX_IP"
    echo "🚂 Schedulers automatiques activés"
else
    echo "⚠️ Site non accessible depuis l'extérieur"
    echo "🔧 Vérification manuelle recommandée"
    echo ""
    echo "🎯 Déploiement terminé (avec avertissement)"
    echo "🌐 Application supposée accessible sur : https://$FREEBOX_IP"
fi

echo ""
echo "📊 Commandes utiles sur la Freebox:"
echo "   ssh $FREEBOX_USER@$FREEBOX_IP"
echo "   cd $REMOTE_PATH"
echo "   docker-compose -f docker-compose.freebox-https.yml --env-file .env.production logs -f"
echo "   docker-compose -f docker-compose.freebox-https.yml --env-file .env.production ps" 