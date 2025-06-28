#!/bin/bash
# Script de déploiement amélioré avec support système d'aide
set -e

echo "🚀 Déploiement Alliance Manager - Version Complète avec Système d'Aide"

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Fonction pour installer Docker
install_docker() {
    echo "📦 Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Installation Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Ajouter l'utilisateur au groupe docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installé! (redémarrage de session requis)"
}

# Fonction pour installer Certbot et générer SSL
install_ssl() {
    echo "🔐 Configuration SSL pour beben0.com..."
    
    # Installation certbot
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installation de Certbot..."
        sudo apt update
        sudo apt install -y certbot
    fi
    
    # Arrêter nginx s'il existe
    sudo systemctl stop nginx 2>/dev/null || true
    
    # Générer les certificats
    echo "📜 Génération des certificats Let's Encrypt..."
    sudo certbot certonly --standalone -d beben0.com --agree-tos --non-interactive --email admin@beben0.com
    
    # Créer le dossier SSL et copier les certificats
    mkdir -p nginx/ssl
    sudo cp /etc/letsencrypt/live/beben0.com/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/beben0.com/privkey.pem nginx/ssl/key.pem
    sudo chown $USER:$USER nginx/ssl/*
    
    echo "✅ Certificats SSL installés!"
}

# Vérifications et installations automatiques
echo "🔍 Vérifications système..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker non trouvé"
    install_docker
else
    echo "✅ Docker installé"
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ Docker Compose non trouvé, installation..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installé"
else
    echo "✅ Docker Compose installé"
fi

# Vérifier/créer fichier .env.production
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ Fichier $ENV_FILE manquant, génération automatique..."
    
    # Générer des secrets sécurisés
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    # Créer le fichier .env.production
    cat > $ENV_FILE << EOF
# ===========================================
# PRODUCTION ENVIRONMENT - beben0.com
# ===========================================
# 🔐 SECRETS GÉNÉRÉS AUTOMATIQUEMENT - NE PAS PARTAGER !

# DATABASE
DATABASE_URL=postgresql://alliance_user:$POSTGRES_PASSWORD@postgres:5432/alliance_manager_prod
POSTGRES_DB=alliance_manager_prod
POSTGRES_USER=alliance_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# NEXTAUTH
NEXTAUTH_URL=https://beben0.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# NODE ENV
NODE_ENV=production

# OPTIONAL: Monitoring & Analytics
# SENTRY_DSN=
# ANALYTICS_ID=
# LOG_LEVEL=error
EOF
    
    echo "✅ Fichier $ENV_FILE créé avec des secrets sécurisés"
else
    echo "✅ Configuration d'environnement trouvée"
fi

# Vérifier/installer SSL
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "⚠️ Certificats SSL manquants"
    install_ssl
else
    echo "✅ Certificats SSL trouvés"
fi

# Configuration firewall
echo "🛡️ Configuration du firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22      # SSH
    sudo ufw allow 80      # HTTP
    sudo ufw allow 443     # HTTPS
    sudo ufw --force enable
    echo "✅ Firewall configuré"
else
    echo "⚠️ UFW non trouvé, firewall non configuré"
fi

# Configuration renouvellement SSL automatique
echo "🔄 Configuration renouvellement SSL automatique..."
CRON_SSL="0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/beben0.com/fullchain.pem $(pwd)/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/beben0.com/privkey.pem $(pwd)/nginx/ssl/key.pem && cd $(pwd) && docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE restart nginx"
(crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_SSL") | crontab -
echo "✅ Renouvellement SSL automatique configuré"

# Configuration backup automatique
echo "💾 Configuration backup automatique..."
mkdir -p backups
CRON_BACKUP="0 2 * * * cd $(pwd) && docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T postgres pg_dump -U alliance_user alliance_manager_prod > backups/backup_\$(date +\\%Y\\%m\\%d).sql"
(crontab -l 2>/dev/null | grep -v pg_dump; echo "$CRON_BACKUP") | crontab -
echo "✅ Backup automatique configuré (quotidien à 2h)"

# Backup de la base de données actuelle
echo "💾 Backup de la base de données..."
if docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps postgres 2>/dev/null | grep -q "Up"; then
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T postgres pg_dump -U alliance_user alliance_manager_prod > backup_$(date +%Y%m%d_%H%M%S).sql
    echo "✅ Backup créé"
fi

# Build et déploiement
echo "🔨 Build de l'application..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache

echo "🏃 Démarrage des services..."
docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

# Attendre que la base soit prête
echo "⏳ Attente du démarrage des services..."
sleep 60

# 🆕 NOUVELLES ÉTAPES POUR LE SYSTÈME D'AIDE
echo "🔧 Mise à jour de la base de données..."
echo "📋 Application des migrations Prisma..."
if docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T app npx prisma db push; then
    echo "✅ Migrations appliquées"
else
    echo "⚠️ Erreur lors des migrations, tentative de génération du client..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T app npx prisma generate
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T app npx prisma db push
fi

echo "🌱 Initialisation complète des données..."
if docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T app npx tsx scripts/complete-seed.ts; then
    echo "✅ Seed complet appliqué avec succès!"
    echo "   📚 Système d'aide initialisé"
    echo "   🔐 Permissions configurées"
    echo "   📝 Données de référence créées"
    echo "   👥 Membres de démonstration ajoutés"
    echo "   🚂 Trains configurés"
else
    echo "⚠️ Erreur lors du seed complet, fallback vers seed simple..."
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec -T app npx tsx scripts/simple-seed.ts
fi

# Tests de santé
echo "🏥 Tests de santé..."
echo "🔍 Test connexion locale..."
if curl -f http://localhost/api/health 2>/dev/null; then
    echo "✅ Application répond en local"
    
    # Test HTTPS si possible
    echo "🔍 Test connexion HTTPS..."
    if curl -f https://beben0.com/api/health 2>/dev/null; then
        echo "✅ Application accessible via HTTPS"
        echo ""
        echo "🎉 DÉPLOIEMENT RÉUSSI!"
        echo "🌐 Votre application est accessible sur: https://beben0.com"
        echo ""
        echo "📋 Informations de connexion:"
        echo "   📧 Admin login: admin@beben0.com"
        echo "   🔑 Admin password: admin123"
        echo ""
        echo "🆕 Nouvelles fonctionnalités disponibles:"
        echo "   📚 Système d'aide complet avec éditeur markdown"
        echo "   🔐 Gestion des permissions par rôle"
        echo "   📝 Données de référence étendues"
        echo "   🎨 Interface moderne avec thème dark/light"
    else
        echo "⚠️ HTTPS pas encore accessible (DNS ou certificats)"
        echo "✅ Application déployée, accessible en local"
    fi
else
    echo "❌ Échec du test de santé"
    echo "📋 Logs des services:"
    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs --tail=20
    echo ""
    echo "🔧 Pour diagnostiquer:"
    echo "   docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
    echo "   docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs app"
    exit 1
fi

echo ""
echo "📊 Commandes utiles:"
echo "   - Logs en temps réel: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
echo "   - Status des services: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
echo "   - Redémarrer: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE restart"
echo "   - Arrêter: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down"
echo "   - Seed manuel: docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE exec app npx tsx scripts/complete-seed.ts"
echo "" 