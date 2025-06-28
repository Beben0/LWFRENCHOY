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

echo "🔐 Génération du .env.production..."
if [ ! -f ".env.production" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    cat > .env.production << ENVEOF
# Production Environment - Freebox Delta
POSTGRES_DB=alliance_manager_prod
POSTGRES_USER=alliance_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
NEXTAUTH_URL=https://beben0.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NODE_ENV=production
ENVEOF
    echo "✅ .env.production créé"
fi

echo "🏃 Démarrage des services HTTPS..."
docker-compose -f docker-compose.freebox-https.yml --env-file .env.production up -d

echo "🏥 Attente du démarrage de l'application..."
sleep 60

echo "🔍 Test de santé HTTPS..."
if curl -k -f https://localhost/api/health 2>/dev/null; then
    echo "✅ Application démarrée avec succès!"
    
    echo "🌱 Application du seed automatique..."
    if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/simple-seed.ts; then
        echo "✅ Seed appliqué avec succès!"
        echo "🎉 Déploiement HTTPS complet sur Freebox Delta!"
        echo "🌐 Application accessible sur : https://beben0.com"
        echo "👤 Login admin : admin@beben0.com / admin123"
    else
        echo "⚠️ Erreur lors du seed, mais l'app fonctionne"
        echo "🌐 Application accessible sur : https://beben0.com"
    fi
else
    echo "⚠️ Application pas encore prête, attente supplémentaire..."
    sleep 30
    if curl -k -f https://localhost/api/health 2>/dev/null; then
        echo "✅ Application démarrée après attente supplémentaire!"
        
        echo "🌱 Application du seed automatique..."
        if docker-compose -f docker-compose.freebox-https.yml --env-file .env.production exec -T app npx tsx scripts/simple-seed.ts; then
            echo "✅ Seed appliqué avec succès!"
            echo "🎉 Déploiement HTTPS complet sur Freebox Delta!"
            echo "🌐 Application accessible sur : https://beben0.com"
            echo "👤 Login admin : admin@beben0.com / admin123"
        else
            echo "⚠️ Erreur lors du seed, mais l'app fonctionne"
            echo "🌐 Application accessible sur : https://beben0.com"
        fi
    else
        echo "⚠️ Déploiement terminé, vérifiez les logs:"
        docker-compose -f docker-compose.freebox-https.yml --env-file .env.production logs --tail=20
    fi
fi

echo "🧹 Nettoyage des fichiers d'installation..."
rm -f alliance-manager-image.tar alliance-manager-project.tar.gz
EOF

# 7. Nettoyage local
echo "🧹 Nettoyage des fichiers temporaires..."
rm -f alliance-manager-image.tar.gz alliance-manager-project.tar.gz

echo ""
echo "🎉 Déploiement terminé!"
echo "🌐 Application accessible sur : https://$FREEBOX_IP"
echo ""
echo "📊 Commandes utiles sur la Freebox:"
echo "   ssh $FREEBOX_USER@$FREEBOX_IP"
echo "   cd $REMOTE_PATH"
echo "   docker-compose -f docker-compose.freebox-https.yml --env-file .env.production logs -f" 