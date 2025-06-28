# 📦 Déploiement sur Freebox Delta

## Principe

Au lieu de builder sur la Freebox (lent), on build en local et on transfert l'image Docker.

## Prérequis

### Sur ta machine (MacBook) :

- ✅ Docker installé
- ✅ Accès SSH à ta Freebox

### Sur ta Freebox Delta :

- ✅ Mode développeur activé
- ✅ Docker installé sur la Freebox
- ✅ SSH configuré

## Configuration initiale Freebox

### 1. Activer le mode développeur

```bash
# Dans l'interface Freebox OS
# Paramètres > Mode avancé > Développeur > Activer
```

### 2. Installer Docker sur la Freebox

```bash
# SSH sur la Freebox
ssh freebox@IP_FREEBOX

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker freebox

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Configuration SSH

```bash
# Sur ta machine, ajouter la clé SSH
ssh-copy-id freebox@IP_FREEBOX
```

## Déploiement

### 1. Configuration du script

```bash
# Éditer le script avec l'IP de ta Freebox
nano deploy-local-build.sh

# Changer cette ligne :
FREEBOX_IP="192.168.1.XXX"  # Ton IP Freebox
FREEBOX_USER="freebox"      # Ou ton utilisateur
```

### 2. Lancement

```bash
# Build local + déploiement automatique
./deploy-local-build.sh
```

### 3. Le script fait automatiquement :

- 🔨 Build l'image Docker en local
- 📦 Sauvegarde en fichier tar.gz
- 📁 Archive le projet
- 📤 Upload vers la Freebox (SCP)
- 🐳 Charge l'image Docker sur la Freebox
- 🚀 Lance les services
- 🔐 Génère les secrets automatiquement

## Architecture déployée

```
Internet → Freebox (port 80) → nginx → Next.js app → PostgreSQL
```

### Services :

- **nginx**: Port 80 (HTTP simple)
- **app**: Alliance Manager (Next.js)
- **postgres**: Base de données

### Limites de ressources (adaptées Freebox) :

- **App**: 512MB RAM, 0.3 CPU
- **PostgreSQL**: 1GB RAM, 0.5 CPU

## Configuration post-déploiement

### 1. Accès local

```bash
# Application accessible sur
http://IP_FREEBOX
```

### 2. Configuration du reverse proxy Freebox

```bash
# Dans Freebox OS : Réglages > Redirection de ports
# Rediriger le port 80 externe vers port 80 du Docker

# Ou utiliser le VPN/OpenVPN de la Freebox
```

### 3. SSL avec Let's Encrypt (optionnel)

```bash
# SSH sur la Freebox
ssh freebox@IP_FREEBOX
cd /home/freebox/alliance-manager

# Installer certbot
sudo apt install certbot

# Générer certificat (si domaine public)
sudo certbot certonly --standalone -d votre-domaine.com
```

## Monitoring et maintenance

### Logs

```bash
# SSH sur la Freebox
ssh freebox@IP_FREEBOX
cd /home/freebox/alliance-manager

# Logs en temps réel
docker-compose -f docker-compose.freebox.yml --env-file .env.production logs -f

# Status des services
docker-compose -f docker-compose.freebox.yml --env-file .env.production ps
```

### Mise à jour

```bash
# Sur ta machine locale
git pull
./deploy-local-build.sh  # Redéploie automatiquement
```

### Redémarrage

```bash
# SSH sur la Freebox
docker-compose -f docker-compose.freebox.yml --env-file .env.production restart
```

### Backup

```bash
# Backup de la base
docker-compose -f docker-compose.freebox.yml --env-file .env.production exec postgres pg_dump -U alliance_user alliance_manager_prod > backup.sql
```

## Dépannage

### Erreur de mémoire

```bash
# Réduire les limites dans docker-compose.freebox.yml
memory: 256M  # Au lieu de 512M
```

### Erreur Docker

```bash
# Nettoyer le système
docker system prune -f
docker volume prune -f
```

### Erreur réseau

```bash
# Vérifier les ports ouverts
sudo netstat -tlnp | grep :80
```

## Avantages de cette méthode

✅ **Build rapide** : Utilise la puissance de ta machine  
✅ **Transfert optimisé** : Image compressée  
✅ **Resources adaptées** : Limites pour Freebox  
✅ **Déploiement simple** : Une seule commande  
✅ **Pas de compilation** sur la Freebox

---

**🎯 Résultat : Alliance Manager qui tourne en local sur ta Freebox !**
