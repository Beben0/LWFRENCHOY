# 🎮 LWFRENCHOY - Last War Alliance Manager

**Gestionnaire d'alliance pour Last War: Survival Game**

Application web complète développée avec Next.js 15, TypeScript et PostgreSQL pour gérer efficacement votre alliance Last War. Système de permissions avancé, dashboard unifié, gestion VS, trains automatisés et bien plus.

## 🚀 Nouvelles Fonctionnalités

### 🛡️ Système de Permissions Unifié

- **Dashboard unifié** : Un seul dashboard qui s'adapte selon les permissions utilisateur
- **Rôles système** : ADMIN (R5) et GUEST (membres)
- **Rôles d'alliance** : R5, R4, MEMBER avec permissions spécifiques
- **Permissions combinées** : Cumul des permissions système + alliance
- **Session enrichie** : Permissions pré-calculées pour performance optimale

### ⚔️ Système VS (Versus Wars) Complet

- **Gestion des semaines VS** : Création, modification, tracking
- **Participants et scores** : Suivi individuel et global
- **Historique détaillé** : Performances par jour et membre
- **Classements** : Automatic ranking et récompenses
- **Import/Export** : Sauvegarde et migration des données VS

### 🚂 Système de Trains Automatisé

- **Scheduler automatique** : Génération des trains futurs
- **Statuts intelligents** : SCHEDULED → BOARDING → DEPARTED → COMPLETED
- **Archivage automatique** : Nettoyage des trains passés
- **Couverture temps réel** : Statistiques de planning
- **API trains v2** : Endpoint moderne pour le nouveau système

### 📊 Dashboard Intelligent

- **Alertes automatiques** : Membres inactifs, créneaux libres
- **Métriques temps réel** : Puissance totale, événements à venir
- **Sections conditionnelles** : Affichage selon permissions utilisateur
- **Status schedulers** : Monitoring des systèmes automatiques

### 🔧 Outils d'Administration

- **Gestionnaire de permissions** : Interface pour configurer les rôles
- **Données de référence** : Gestion centralisée des options
- **Import/Export avancé** : CSV avec logs détaillés
- **Système d'invitations** : Liens d'invitation sécurisés
- **Test de permissions** : Page de debug pour validation

## 🛠️ Architecture Technique

### Stack Principale

- **Frontend** : Next.js 15 App Router + TypeScript
- **Styling** : Tailwind CSS (dark mode optimisé gaming)
- **Database** : PostgreSQL 15 + Prisma ORM
- **Auth** : NextAuth.js v5 avec sessions enrichies
- **Validation** : Zod pour tous les schemas
- **Deployment** : Docker Multi-stage + Docker Compose

### Modèles de Données

```typescript
// Utilisateurs et authentification
User (id, email, pseudo, role, allianceRole)
Member (pseudo, level, power, kills, specialty, allianceRole)

// Système VS Wars
VSWeek (weekNumber, year, enemyName, scores)
VSParticipant (kills, deaths, powerGain, participation)
VSDay (dayNumber, dailyScores, events)

// Système Trains
TrainInstance (date, departureTime, conductor, passengers)
TrainSlot (legacy system for backwards compatibility)

// Événements et données
Event (title, type, dates, recurring)
RolePermission (roleType, permission, enabled)
ReferenceData (category, key, label, metadata)
```

### Système de Permissions

```typescript
// Permissions disponibles
type Permission =
  | "view_dashboard"
  | "view_members"
  | "view_trains"
  | "edit_member"
  | "create_event"
  | "manage_vs_participants"
  | "manage_users"
  | "export_data"
  | "manage_alerts";
// ... 25+ permissions granulaires

// Logique de vérification
function hasPermission(session, permission) {
  // 1. Vérifier session.user.permissions (pré-calculé)
  // 2. Fallback sur permissions synchrones hardcodées
  // 3. Cumul rôle système + rôle alliance
}
```

## 🚀 Installation et Déploiement

### 🐳 Méthode Docker (Recommandée)

```bash
# Cloner le projet
git clone https://github.com/your-org/lwfrenchoy.git
cd lwfrenchoy

# Configuration
cp docker.env.example .env

# Démarrage rapide
docker-compose up --build -d

# Vérifier le déploiement
curl http://localhost:3000/api/health
```

### 🔧 Installation Développement

```bash
# Installation des dépendances
npm install

# Base de données
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:15

# Configuration
cp .env.local.example .env.local
# Éditer DATABASE_URL, NEXTAUTH_SECRET, etc.

# Migration et données de demo
npx prisma db push
npm run db:seed

# Démarrage
npm run dev
```

### 🌐 Déploiement Production

#### Option 1: Script de Déploiement Local + Freebox

```bash
# Build local et transfert optimisé
chmod +x deploy-local-build.sh
./deploy-local-build.sh

# Le script fait automatiquement:
# - Build multi-stage Docker local
# - Compression et transfert vers serveur
# - Déploiement avec limites de ressources
# - Génération des secrets
```

#### Option 2: VPS Classique

```bash
# Sur le serveur de production
git clone https://github.com/your-org/lwfrenchoy.git
cd lwfrenchoy

# Configuration production
cp env.production.example .env.production
# Configurer NEXTAUTH_SECRET, DATABASE_URL, NEXTAUTH_URL

# SSL avec Let's Encrypt
certbot certonly --standalone -d votre-domaine.com
cp /etc/letsencrypt/live/votre-domaine.com/* nginx/ssl/

# Déploiement
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 3: Freebox Delta (Configuration Spéciale)

```bash
# Ressources limitées, configuration adaptée
docker-compose -f docker-compose.freebox.yml up -d

# Limites appliquées:
# - App: 512MB RAM, 0.3 CPU
# - PostgreSQL: 1GB RAM, 0.5 CPU
# - Nginx simplifié HTTP (évolutif HTTPS)
```

## 📋 Configuration

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://user:pass@localhost:5432/alliance_manager"

# Authentication NextAuth v5
NEXTAUTH_URL="https://votre-domaine.com"
NEXTAUTH_SECRET="generated-with-openssl-rand-base64-32"

# Production
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1

# PostgreSQL (Docker)
POSTGRES_DB=alliance_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
```

### Comptes par Défaut

```bash
# Administrateur principal
Email: admin@alliance.gg
Password: admin123
Rôle: ADMIN + R5
Permissions: Accès complet

# Membre de test
Email: member@alliance.gg
Password: member123
Rôle: GUEST + R4
Permissions: Limitées selon R4
```

## 🎯 Fonctionnalités Détaillées

### 🛡️ Gestion des Membres

- **Liste intelligente** : Filtrage par pseudo, spécialité, statut, rôle
- **Tri dynamique** : Puissance, kills, niveau, dernière activité
- **Actions CRUD** : Création, modification, suppression sécurisées
- **Import/Export CSV** : Migration depuis Excel avec validation
- **Alertes d'inactivité** : Détection automatique > 7 jours
- **Tags personnalisés** : Système de marquage flexible

### ⚔️ Système VS (Versus Wars)

- **Création de semaines** : Assistant de configuration VS
- **Gestion participants** : Ajout/suppression avec validation
- **Scores quotidiens** : Tracking jour par jour (J1-J6)
- **Classements automatiques** : Ranking basé sur performance
- **Récompenses MVP** : Système de badges et titres
- **Historique complet** : Archive de toutes les guerres passées
- **Statistiques avancées** : Ratio K/D, participation, évolution

### 🚂 Planning des Trains

- **Vue hebdomadaire** : Grille 7 jours avec créneaux horaires
- **Assignment rapide** : Glisser-déposer ou modal de sélection
- **Scheduler automatique** : Génération trains futurs (14 jours)
- **Statuts intelligents** : Workflow SCHEDULED → BOARDING → DEPARTED
- **Archivage automatique** : Nettoyage des données anciennes
- **Couverture temps réel** : Pourcentage de créneaux couverts
- **Historique conducteurs** : Tracking des performances

### 📊 Dashboard Unifié

- **Métriques clés** : Membres actifs, puissance totale, événements
- **Alertes contextuelles** : Membres inactifs, créneaux libres
- **Status schedulers** : Monitoring des systèmes automatiques
- **Navigation intelligente** : Sections selon permissions utilisateur
- **Widgets modulaires** : Interface adaptative par rôle

### 📆 Événements et Calendrier

- **Types d'événements** : Guerre d'alliance, Boss, Serveur, Saisonnier
- **Récurrence** : Événements répétitifs avec fin programmée
- **Notifications** : Alertes 24h avant événement
- **Description riche** : Markdown avec formatage
- **Tags et catégories** : Classification flexible

### 📈 Statistiques et Analyses

- **Évolution temporelle** : Graphiques de progression alliance
- **Classements internes** : Top joueurs par métrique
- **Analyses de performance** : Corrélations puissance/activité
- **Exports personnalisés** : Rapports pour R5/R4
- **Métriques VS** : Performances en guerre d'alliance

## 🔐 Système de Sécurité

### Authentification

- **NextAuth v5** : Sessions JWT sécurisées
- **Hashage bcrypt** : Mots de passe protégés
- **Session enrichie** : Permissions pré-calculées pour performance
- **Expiration automatique** : Gestion des sessions inactives

### Permissions Granulaires

```typescript
// 25+ permissions spécifiques
view_dashboard, view_members, view_trains, view_vs;
create_member, edit_member, delete_member;
manage_users, manage_permissions, export_data;
create_vs_week, edit_vs_results, manage_vs_participants;
// ...
```

### Protection des Routes

- **Middleware intelligent** : Vérification permissions côté serveur
- **Guards React** : Composants protégés côté client
- **API sécurisées** : Validation session sur tous les endpoints
- **Fallback gracieux** : Redirection appropriée selon rôle

### Contrôle d'Accès

- **Rôles hiérarchiques** : ADMIN > R5 > R4 > MEMBER > GUEST
- **Permissions cumulatives** : Système additif (rôle + alliance)
- **Cache intelligent** : Performance optimisée avec invalidation
- **Tests intégrés** : Page debug pour validation permissions

## 🧪 Fonctionnalités de Test

### Données de Démonstration

- **50+ membres réalistes** : Données Last War authentiques
- **Historique VS** : 5 semaines avec participants et scores
- **Planning trains** : 2 semaines de créneaux configurés
- **Événements futurs** : Guerres et boss programmés

### Page de Test Permissions

- **Sélection membre** : Test permissions de n'importe quel utilisateur
- **Debug session** : Affichage détaillé rôles et permissions
- **Simulation navigation** : Prévisualisation interface utilisateur
- **Validation cohérence** : Vérification sync/async permissions

### Health Checks

- **API health** : `/api/health` avec test base de données
- **Docker health** : Vérifications automatiques conteneurs
- **Monitoring** : Logs détaillés et métriques système

## 📱 Optimisations Mobile

### Interface Adaptative

- **Mobile-first** : Design optimisé tactile
- **Navigation simplifiée** : Menu burger avec sections principales
- **Actions rapides** : Gestes swipe et tap optimisés
- **Modals responsives** : Formulaires adaptés écran

### Performance

- **Lazy loading** : Composants chargés à la demande
- **Pagination intelligente** : Chunks de 50 membres max
- **Cache agressif** : Réduction requêtes API répétitives
- **Images optimisées** : WebP avec fallback

## 🔧 Maintenance et Monitoring

### Outils Intégrés

```bash
# Logs en temps réel
docker-compose logs -f app

# Métriques système
docker stats

# Health checks
curl https://votre-domaine.com/api/health

# Backup automatique (cron)
0 2 * * * docker-compose exec postgres pg_dump > backup.sql
```

### Schedulers Automatiques

- **Train Scheduler** : Génération automatique trains futurs
- **Alert Engine** : Détection membres inactifs + notifications
- **Data Cleanup** : Archivage automatique données anciennes
- **Permission Cache** : Invalidation intelligente cache permissions

### Alertes et Notifications

- **Système d'alertes** : Email + notifications in-app
- **Seuils configurables** : Inactivité, couverture trains, événements
- **Escalade automatique** : Notifications R4 → R5 si critique
- **Historique alertes** : Audit trail des notifications envoyées

## 🚀 Évolutions Futures

### Roadmap Techniques

- [ ] Migration vers Next.js 15 App Router complet
- [ ] Implémentation PWA pour usage mobile offline
- [ ] API GraphQL pour requêtes optimisées
- [ ] Système de cache Redis pour haute performance
- [ ] Intégration Webhooks Discord/Telegram

### Fonctionnalités Métier

- [ ] Module de guerre inter-serveurs (Cross-Server Wars)
- [ ] Système de récompenses et achievements
- [ ] IA prédictive pour recommandations stratégiques
- [ ] Intégration API Last War (si disponible)
- [ ] Module économique (ressources, échanges)

## 🤝 Contribution

### Workflow de Développement

```bash
# 1. Fork et clone
git clone https://github.com/votre-username/lwfrenchoy.git

# 2. Branche feature
git checkout -b feature/nouvelle-fonctionnalite

# 3. Développement avec tests
npm run dev
npm run test

# 4. Commit et push
git commit -m "feat: description de la fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# 5. Pull Request avec description détaillée
```

### Standards de Code

- **TypeScript strict** : Typage complet obligatoire
- **ESLint + Prettier** : Formatage automatique
- **Composants modulaires** : Séparation responsabilités
- **Tests unitaires** : Couverture fonctions critiques
- **Documentation** : JSDoc pour fonctions complexes

## 📄 Licence et Support

**Licence MIT** - Utilisation libre pour communautés Last War

### Support Communauté

- **Discord** : [Serveur support LWFRENCHOY]
- **GitHub Issues** : Bugs et demandes de fonctionnalités
- **Wiki** : Documentation utilisateur détaillée
- **Contributions** : PRs welcomes pour améliorations

### Déploiement Professionnel

Pour un déploiement en production avec support technique :

- Configuration serveur optimisée
- Monitoring avancé avec alertes
- Backups automatiques et disaster recovery
- Support technique prioritaire

---

**⚔️ Développé par et pour la communauté Last War: Survival Game** 🎮

_Version actuelle : 2.0.0 - Dashboard Unifié avec Système VS Complet_
