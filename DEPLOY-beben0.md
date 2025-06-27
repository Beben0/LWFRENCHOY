# 🚀 Déploiement Alliance Manager - beben0.com

## Configuration ready-to-deploy

✅ **Domaine configuré :** `beben0.com`  
✅ **Secrets générés :** `.env.production` avec vrais secrets  
✅ **Nginx configuré :** HTTPS + sécurité  
✅ **PostgreSQL optimisé**

## Étapes de déploiement

### 1. Configuration DNS

```bash
# Configure ton DNS chez ton registrar
A     beben0.com     → IP_DE_TON_SERVEUR
AAAA  beben0.com     → IPv6_DE_TON_SERVEUR (optionnel)
```

### 2. Installation serveur

```bash
# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Installation Certbot pour SSL
sudo apt install certbot
```

### 3. Déploiement du code

```bash
# Cloner le repo
git clone YOUR_REPO_URL alliance-manager
cd alliance-manager

# Le fichier .env.production est déjà configuré ✅
# Les domaines nginx sont configurés ✅
```

### 4. Certificats SSL Let's Encrypt

```bash
# Arrêter nginx s'il tourne
sudo systemctl stop nginx || true

# Générer les certificats
sudo certbot certonly --standalone -d beben0.com

# Copier dans le projet
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/beben0.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/beben0.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*
```

### 5. Déploiement final

```bash
# Lancer le déploiement
./deploy.sh
```

### 6. Vérification

```bash
# Test de santé
curl https://beben0.com/api/health

# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Status des services
docker-compose -f docker-compose.prod.yml ps
```

## Configuration firewall

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw --force enable
```

## Renouvellement SSL automatique

```bash
# Ajouter au crontab
echo "0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/beben0.com/fullchain.pem /path/to/alliance-manager/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/beben0.com/privkey.pem /path/to/alliance-manager/nginx/ssl/key.pem && docker-compose -f /path/to/alliance-manager/docker-compose.prod.yml restart nginx" | sudo crontab -
```

## Backup automatique

```bash
# Backup quotidien à 2h du matin
echo "0 2 * * * cd /path/to/alliance-manager && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U alliance_user alliance_manager_prod > backups/backup_\$(date +\%Y\%m\%d).sql" | crontab -
```

## Monitoring

```bash
# Métriques système
docker stats

# Logs application
docker-compose -f docker-compose.prod.yml logs app -f

# Logs nginx
docker-compose -f docker-compose.prod.yml logs nginx -f

# Espace disque
df -h
docker system df
```

## Dépannage

### Service ne démarre pas

```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs

# Reconstruire si nécessaire
docker-compose -f docker-compose.prod.yml build --no-cache app
```

### SSL ne fonctionne pas

```bash
# Vérifier les certificats
ls -la nginx/ssl/
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Redémarrer nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Performance lente

```bash
# Vérifier les ressources
docker stats
free -m
iostat

# Optimiser si nécessaire
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml up -d
```

---

**🎯 Ton app sera disponible sur : https://beben0.com**
