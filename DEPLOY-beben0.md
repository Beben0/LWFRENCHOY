# 🚀 Déploiement Alliance Manager - beben0.com

## Configuration ready-to-deploy

✅ **Domaine configuré :** `beben0.com`  
✅ **Secrets générés :** `.env.production` avec vrais secrets  
✅ **Nginx configuré :** HTTPS + sécurité  
✅ **PostgreSQL optimisé**

## Déploiement en 3 étapes simples

### 1. Configuration DNS (obligatoire)

```bash
# Configure ton DNS chez ton registrar
A     beben0.com     → IP_DE_TON_SERVEUR
AAAA  beben0.com     → IPv6_DE_TON_SERVEUR (optionnel)
```

### 2. Cloner et déployer

```bash
# Cloner le repo sur ton serveur
git clone YOUR_REPO_URL alliance-manager
cd alliance-manager

# LE SCRIPT FAIT TOUT! 🚀
./deploy.sh
```

### 3. Vérification (automatique)

Le script teste automatiquement :

- ✅ Application locale accessible
- ✅ HTTPS fonctionnel
- ✅ Tests de santé

## Ce que le script deploy.sh fait automatiquement

### 🔧 Installation automatique :

- **Docker & Docker Compose** (si manquant)
- **Certbot** pour Let's Encrypt
- **Certificats SSL** pour beben0.com
- **Firewall UFW** (ports 22, 80, 443)

### ⚙️ Configuration automatique :

- **Renouvellement SSL** automatique (3h du matin)
- **Backup quotidien** de la base (2h du matin)
- **Security headers** et rate limiting
- **Monitoring** et health checks

### 🎯 Résultat final :

Application accessible sur **https://beben0.com** avec sécurité enterprise-grade!

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
