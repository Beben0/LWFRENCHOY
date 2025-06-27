# 🚀 Guide de Déploiement en Production

## Checklist de déploiement

### 1. Configuration des secrets

```bash
# Copier le template
cp env.production.example .env.production

# Générer des secrets sécurisés
openssl rand -base64 32  # Pour NEXTAUTH_SECRET
openssl rand -base64 32  # Pour POSTGRES_PASSWORD
```

### 2. Certificats SSL

```bash
# Créer le dossier SSL
mkdir -p nginx/ssl

# Option A: Let's Encrypt (recommandé)
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Option B: Certificat auto-signé (dev seulement)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
```

### 3. Configuration du domaine

```bash
# Modifier nginx/nginx.conf
sed -i 's/your-domain.com/votredomaine.com/g' nginx/nginx.conf

# Modifier .env.production
NEXTAUTH_URL=https://votredomaine.com
```

### 4. Déploiement

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Déployer
./deploy.sh
```

## Configuration serveur

### Optimisations système

```bash
# Augmenter les limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimisations réseau
echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
sysctl -p
```

### Monitoring

```bash
# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Métriques système
docker stats

# Santé des services
curl https://votredomaine.com/api/health
```

### Backup automatique

```bash
# Ajouter au crontab (backup quotidien à 2h)
0 2 * * * cd /path/to/app && docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backups/backup_$(date +\%Y\%m\%d).sql
```

## Sécurité

### Firewall

```bash
# UFW (Ubuntu)
ufw allow 22     # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw enable
```

### Rotation des logs

```bash
# /etc/logrotate.d/alliance-manager
/path/to/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## Dépannage

### Problèmes fréquents

```bash
# Vérifier les services
docker-compose -f docker-compose.prod.yml ps

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart app

# Vérifier les ressources
docker system df
docker system prune  # Nettoyer si nécessaire
```

### Mise à jour

```bash
# Pull des nouveaux changements
git pull origin main

# Redéploiement
./deploy.sh
```
