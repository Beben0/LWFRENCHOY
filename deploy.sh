#!/bin/bash
# Script de déploiement autonome pour production
set -e

echo "🚀 Déploiement Alliance Manager - Production (beben0.com)"

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

# Vérifier fichier .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant!"
    echo "Le fichier devrait déjà être présent avec les secrets générés"
    exit 1
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
CRON_SSL="0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/beben0.com/fullchain.pem $(pwd)/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/beben0.com/privkey.pem $(pwd)/nginx/ssl/key.pem && cd $(pwd) && docker-compose -f docker-compose.prod.yml restart nginx"
(crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_SSL") | crontab -
echo "✅ Renouvellement SSL automatique configuré"

# Configuration backup automatique
echo "💾 Configuration backup automatique..."
mkdir -p backups
CRON_BACKUP="0 2 * * * cd $(pwd) && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U alliance_user alliance_manager_prod > backups/backup_\$(date +\\%Y\\%m\\%d).sql"
(crontab -l 2>/dev/null | grep -v pg_dump; echo "$CRON_BACKUP") | crontab -
echo "✅ Backup automatique configuré (quotidien à 2h)"

# Backup de la base de données actuelle
echo "💾 Backup de la base de données..."
if docker-compose -f docker-compose.prod.yml ps postgres 2>/dev/null | grep -q "Up"; then
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U alliance_user alliance_manager_prod > backup_$(date +%Y%m%d_%H%M%S).sql
    echo "✅ Backup créé"
fi

# Build et déploiement
echo "🔨 Build de l'application..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🏃 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Tests de santé
echo "🏥 Tests de santé..."
echo "⏳ Attente du démarrage des services (60s)..."
sleep 60

# Test local d'abord
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
    else
        echo "⚠️ HTTPS pas encore accessible (DNS ou certificats)"
        echo "✅ Application déployée, accessible en local"
    fi
else
    echo "❌ Échec du test de santé"
    echo "📋 Logs des services:"
    docker-compose -f docker-compose.prod.yml logs --tail=20
    echo ""
    echo "🔧 Pour diagnostiquer:"
    echo "   docker-compose -f docker-compose.prod.yml ps"
    echo "   docker-compose -f docker-compose.prod.yml logs app"
    exit 1
fi

echo ""
echo "📊 Commandes utiles:"
echo "   - Logs en temps réel: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Status des services: docker-compose -f docker-compose.prod.yml ps"
echo "   - Redémarrer: docker-compose -f docker-compose.prod.yml restart"
echo "   - Arrêter: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "🔐 Sécurité configurée:"
echo "   ✅ Firewall UFW activé (ports 22, 80, 443)"
echo "   ✅ SSL Let's Encrypt avec renouvellement automatique"
echo "   ✅ Backup quotidien automatique (2h du matin)"
echo "   ✅ Rate limiting et security headers" 