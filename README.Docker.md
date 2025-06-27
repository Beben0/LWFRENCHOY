# 🐳 Guide Docker - LWFRENCHOY Alliance Manager

Ce guide explique comment déployer l'application LWFRENCHOY Alliance Manager avec Docker.

## 🚀 Démarrage rapide

### Production

```bash
# 1. Copier les variables d'environnement
cp docker.env.example .env

# 2. Modifier les variables de production
nano .env

# 3. Démarrer l'application
docker-compose up -d

# 4. Voir les logs
docker-compose logs -f app
```

### Développement

```bash
# Démarrer seulement la base de données
docker-compose -f docker-compose.dev.yml up -d

# Ou démarrer tout en mode développement
docker-compose -f docker-compose.yml --env-file .env.local up
```

## 📁 Structure des fichiers Docker

```
├── Dockerfile              # Production multi-stage
├── Dockerfile.dev          # Développement avec hot reload
├── docker-compose.yml      # Production avec variables d'env
├── docker-compose.dev.yml  # Base de données seulement
├── docker.env.example      # Template des variables
└── scripts/
    ├── docker-entrypoint.sh # Script de démarrage
    └── init-db.sql         # Initialisation PostgreSQL
```

## ⚙️ Configuration

### Variables d'environnement obligatoires

```bash
# Base de données
POSTGRES_DB=alliance_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_password_in_production

# Application
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=un-secret-tres-long-minimum-32-caracteres
```

### Variables optionnelles

```bash
POSTGRES_PORT=5432
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 🛠️ Commandes utiles

### Gestion des conteneurs

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Redémarrer
docker-compose restart

# Voir les logs
docker-compose logs -f app
docker-compose logs -f postgres

# Reconstruire après modification
docker-compose up --build -d
```

### Base de données

```bash
# Accès PostgreSQL
docker-compose exec postgres psql -U postgres -d alliance_manager

# Backup
docker-compose exec postgres pg_dump -U postgres alliance_manager > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d alliance_manager

# Reset complet
docker-compose down -v
docker-compose up -d
```

### Debugging

```bash
# Accès shell du conteneur app
docker-compose exec app sh

# Voir les ressources
docker stats

# Inspecter les volumes
docker volume inspect lwfrenchoy_postgres_data
```

## 🏥 Health Checks

L'application inclut plusieurs health checks :

- **App** : `GET /api/health` - Vérifie l'app + DB
- **PostgreSQL** : `pg_isready` - Vérifie la disponibilité DB

```bash
# Tester manuellement
curl http://localhost:3000/api/health
```

## 🔧 Optimisations Production

### Performance

- Build multi-stage pour réduire la taille de l'image
- Standalone output Next.js
- Utilisateur non-root pour la sécurité
- Cache des layers Docker optimisé

### Sécurité

- Pas de secrets hardcodés
- Variables d'environnement externalisées
- Utilisateurs non-privilégiés
- Health checks automatiques

### Monitoring

```bash
# Surveiller les ressources
docker stats

# Logs avec rotation
docker-compose logs --tail=100 -f app

# Alertes de santé
curl -f http://localhost:3000/api/health || echo "Service down!"
```

## 🚨 Troubleshooting

### Problèmes courants

1. **Base de données non accessible**

   ```bash
   docker-compose logs postgres
   docker-compose exec postgres pg_isready -U postgres
   ```

2. **Prisma client non généré**

   ```bash
   docker-compose exec app npx prisma generate
   ```

3. **Migrations échouées**

   ```bash
   docker-compose exec app npx prisma db push
   ```

4. **Variables d'environnement manquantes**
   ```bash
   docker-compose config  # Vérifier la config
   ```

### Reset complet

```bash
# Attention : supprime toutes les données !
docker-compose down -v --remove-orphans
docker system prune -f
docker-compose up --build -d
```

## 📊 Monitoring Production

### Logs

```bash
# Logs en temps réel
docker-compose logs -f --tail=100

# Logs par service
docker-compose logs app
docker-compose logs postgres
```

### Métriques

```bash
# Utilisation ressources
docker stats

# Espace disque
docker system df

# Volumes
docker volume ls
```

## 🔄 Mise à jour

```bash
# 1. Backup
docker-compose exec postgres pg_dump -U postgres alliance_manager > backup_$(date +%Y%m%d).sql

# 2. Pull nouveau code
git pull origin main

# 3. Rebuild
docker-compose build --no-cache

# 4. Redémarrer
docker-compose up -d

# 5. Vérifier
curl http://localhost:3000/api/health
```

## 📞 Support

En cas de problème :

1. Vérifier les logs : `docker-compose logs -f`
2. Tester les health checks : `curl http://localhost:3000/api/health`
3. Vérifier les variables d'environnement : `docker-compose config`
