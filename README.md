# FROY Frenchoy - Last War: Survival Game

**Gestionnaire d'alliance professionnel pour Last War: Survival Game**

Application web complète développée avec Next.js 15, TypeScript et PostgreSQL pour gérer efficacement votre alliance Last War.

## 🎯 Fonctionnalités

### 🧑 Gestion des Membres (Priorité Max)
- **Liste complète** avec filtrage avancé (pseudo, niveau, puissance, spécialité)
- **Tri intelligent** par puissance, kills, dernière activité
- **Actions CRUD** : ajout, modification, suppression de membres
- **Import/Export CSV** pour migration depuis Excel
- **Tags et notes** personnalisés
- **Suivi d'activité** avec alertes d'inactivité

### 🚂 Planning des Trains (Feature Unique)
- **Vue hebdomadaire** avec grille 7 jours × 5 créneaux
- **Assignment rapide** par clic avec modal de sélection
- **Indicateurs visuels** : créneaux libres/occupés
- **Statistiques de couverture** en temps réel
- **Gestion des conducteurs** par spécialité

### 📊 Dashboard & Métriques
- **Vue d'ensemble** : membres actifs, puissance totale
- **Alertes automatiques** : créneaux libres, membres inactifs
- **Activité récente** : dernières connexions
- **Événements prochains** avec notifications

### 📆 Événements & Guerres
- **Calendrier** des guerres d'alliance (GvG)
- **Boss d'alliance** et événements serveur
- **Participation tracking**
- **Rappels automatiques**

### 📈 Statistiques & Performance
- **Classements internes** par puissance/kills
- **Évolution temporelle** des membres
- **Analyses de performance** d'alliance
- **Exports pour rapports R5**

## 🔐 Système d'Authentification

- **Rôles** : Admin (R5/R4) et Membre
- **Protection** : routes admin sécurisées
- **Compte demo** : `admin@alliance.gg` / `admin123`

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 App Router + TypeScript
- **Styling** : Tailwind CSS (dark mode par défaut)
- **Database** : PostgreSQL + Prisma ORM
- **Auth** : NextAuth.js avec credentials
- **Validation** : Zod
- **Deployment** : Docker + Docker Compose

## 🚀 Installation et Lancement

### Méthode rapide avec Docker (Recommandée)

```bash
# Cloner le projet
git clone <repository-url>
cd alliance-manager

# Lancer avec Docker Compose
docker-compose up --build

# L'application sera disponible sur http://localhost:3000
```

### Installation manuelle

```bash
# Installation des dépendances
npm install

# Configuration de la base de données
cp .env.local.example .env.local
# Éditer .env.local avec vos paramètres

# Démarrer PostgreSQL
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15

# Migration et seed de la base
npx prisma db push
npm run db:seed

# Lancer en développement
npm run dev
```

## 📋 Configuration

### Variables d'environnement (.env.local)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/alliance"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Compte par défaut

- **Email** : `admin@alliance.gg`
- **Mot de passe** : `admin123`
- **Rôle** : Administrateur (accès complet)

## 📊 Structure des Données

### Modèles Principaux

- **User** : Authentification et rôles
- **Member** : Données Last War (pseudo, niveau, puissance, kills)
- **TrainSlot** : Planning des conducteurs de trains
- **Event** : Guerres et événements d'alliance
- **AllianceStats** : Métriques globales

### Import de Données

Format CSV supporté pour l'import de membres :
```csv
pseudo,level,power,kills,specialty,allianceRole,status
DragonSlayer,45,2850000,1250,Sniper,R5,ACTIVE
IronFist,42,2650000,980,Tank,R4,ACTIVE
```

## 🎨 Design & UX

- **Dark mode** par défaut (gaming aesthetic)
- **Couleurs Last War** : rouge/orange pour urgences, vert pour OK
- **Mobile-first** : optimisé pour gestion mobile
- **Actions rapides** : moins de clics possible
- **Feedback visuel** : loading states, confirmations

## 🔄 Fonctionnalités Avancées

### Filtres et Recherche
- **Recherche textuelle** sur pseudos
- **Filtres multiples** : spécialité, statut, rôle
- **Tri dynamique** : puissance, level, kills, activité
- **Pagination** intelligente

### Alertes et Notifications
- **Membres inactifs** : > 7 jours sans connexion
- **Créneaux libres** : trains sans conducteur
- **Événements prochains** : 24h avant guerre

### Export et Backup
- **Export CSV** : tous les membres avec données
- **Backup** : sauvegarde complète de l'alliance
- **Import** : migration depuis Excel/Google Sheets

## 🧪 Tests et Validation

### Données de Démonstration
- **15 membres** avec données réalistes
- **Planning trains** pré-configuré
- **Événements** : guerres et boss prochains
- **Statistiques** : métriques d'alliance

### Scénarios de Test
1. **Import** de 50 membres via CSV
2. **Assignment** conducteurs pour une semaine
3. **Création** événement "Guerre Samedi 20h"
4. **Export** backup des données

## 📱 Utilisation Mobile

L'application est optimisée pour les R5/R4 qui gèrent souvent leur alliance depuis leur téléphone :

- **Navigation** adaptative
- **Actions tactiles** : swipe, tap
- **Modals** optimisées pour mobile
- **Performance** : chargement rapide

## 🚀 Déploiement Production

### Docker Compose (Recommandé)

```bash
# Production avec HTTPS
docker-compose -f docker-compose.prod.yml up -d

# Variables d'environnement production
NEXTAUTH_SECRET="super-secret-production-key"
NEXTAUTH_URL="https://votre-domaine.com"
DATABASE_URL="postgresql://user:pass@db:5432/alliance"
```

### Serveur VPS

```bash
# Installation sur Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cloner et lancer
git clone <repo> && cd alliance-manager
docker-compose up -d

# Configuration reverse proxy (Nginx)
# SSL avec Let's Encrypt
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

## 🎮 Spécifique Last War

### Spécialités de Membres
- **Sniper** : DPS élevé, raids
- **Tank** : Défense, protection base
- **Farmer** : Ressources, économie
- **Defense** : Fortifications
- **Support** : Buffs, soins
- **Scout** : Reconnaissance

### Types d'Événements
- **ALLIANCE_WAR** : Guerres GvG
- **BOSS_FIGHT** : Boss d'alliance
- **SERVER_WAR** : Guerres cross-server
- **SEASONAL** : Événements saisonniers

### Métriques Importantes
- **Puissance** : Force totale du membre
- **Kills** : Éliminations en PvP
- **Niveau** : Progression du joueur
- **Dernière activité** : Détection d'inactivité

---

**Développé pour la communauté Last War par des joueurs passionnés** 🎮⚔️ 