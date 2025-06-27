#!/bin/bash
# Script de déploiement pour production
set -e

echo "🚀 Déploiement Alliance Manager - Production"

# Vérifications pré-déploiement
echo "🔍 Vérifications pré-déploiement..."

if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant!"
    echo "Créer à partir de env.production.example"
    exit 1
fi

if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "❌ Certificats SSL manquants dans nginx/ssl/"
    echo "Générer avec Let's Encrypt ou votre CA"
    exit 1
fi

# Backup de la base de données
echo "💾 Backup de la base de données..."
if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U \$POSTGRES_USER \$POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
    echo "✅ Backup créé"
fi

# Build et déploiement
echo "🔨 Build de l'application..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🏃 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Tests de santé
echo "🏥 Tests de santé..."
sleep 30

if curl -f http://localhost/api/health; then
    echo "✅ Application déployée avec succès!"
else
    echo "❌ Échec du déploiement - vérifier les logs"
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi

echo "🎉 Déploiement terminé!"
echo "📊 Monitoring: docker-compose -f docker-compose.prod.yml logs -f" 