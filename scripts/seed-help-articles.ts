import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding help articles...");

  // 1. Ajouter les données de référence pour les catégories d'aide
  const helpCategories = [
    {
      key: "GAME_BASICS",
      label: "Bases du jeu",
      description: "Guides pour débuter dans Last War",
      sortOrder: 1,
      color: "#3B82F6",
    },
    {
      key: "STRATEGY",
      label: "Stratégies",
      description: "Stratégies avancées et conseils tactiques",
      sortOrder: 2,
      color: "#059669",
    },
    {
      key: "ALLIANCE",
      label: "Alliance",
      description: "Tout sur la vie en alliance",
      sortOrder: 3,
      color: "#8B5CF6",
    },
    {
      key: "TRAINS",
      label: "Trains",
      description: "Système de trains d'alliance",
      sortOrder: 4,
      color: "#DC2626",
    },
    {
      key: "EVENTS",
      label: "Événements",
      description: "Événements du jeu et de l'alliance",
      sortOrder: 5,
      color: "#F59E0B",
    },
    {
      key: "TIPS_TRICKS",
      label: "Astuces",
      description: "Trucs et astuces utiles",
      sortOrder: 6,
      color: "#10B981",
    },
    {
      key: "FAQ",
      label: "Questions fréquentes",
      description: "Réponses aux questions courantes",
      sortOrder: 7,
      color: "#6B7280",
    },
    {
      key: "TUTORIAL",
      label: "Tutoriels",
      description: "Tutoriels pas à pas",
      sortOrder: 8,
      color: "#EC4899",
    },
    {
      key: "ADVANCED",
      label: "Avancé",
      description: "Contenu pour joueurs expérimentés",
      sortOrder: 9,
      color: "#7C2D12",
    },
  ];

  for (const category of helpCategories) {
    await prisma.referenceData.upsert({
      where: {
        category_key: { category: "HELP_CATEGORY", key: category.key },
      },
      update: {},
      create: {
        category: "HELP_CATEGORY",
        key: category.key,
        label: category.label,
        description: category.description,
        color: category.color,
        sortOrder: category.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // 2. Ajouter les statuts d'articles
  const helpStatuses = [
    {
      key: "DRAFT",
      label: "Brouillon",
      description: "Article en cours de rédaction",
      sortOrder: 1,
      color: "#6B7280",
    },
    {
      key: "REVIEW",
      label: "En révision",
      description: "Article en attente de révision",
      sortOrder: 2,
      color: "#F59E0B",
    },
    {
      key: "PUBLISHED",
      label: "Publié",
      description: "Article publié et visible",
      sortOrder: 3,
      color: "#10B981",
    },
    {
      key: "ARCHIVED",
      label: "Archivé",
      description: "Article archivé",
      sortOrder: 4,
      color: "#EF4444",
    },
  ];

  for (const status of helpStatuses) {
    await prisma.referenceData.upsert({
      where: {
        category_key: { category: "HELP_STATUS", key: status.key },
      },
      update: {},
      create: {
        category: "HELP_STATUS",
        key: status.key,
        label: status.label,
        description: status.description,
        color: status.color,
        sortOrder: status.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // 3. Tags d'aide prédéfinis
  const helpTags = [
    {
      key: "DEBUTANT",
      label: "Débutant",
      description: "Pour les nouveaux joueurs",
      sortOrder: 1,
      color: "#3B82F6",
    },
    {
      key: "AVANCE",
      label: "Avancé",
      description: "Pour les joueurs expérimentés",
      sortOrder: 2,
      color: "#7C2D12",
    },
    {
      key: "TUTORIEL",
      label: "Tutoriel",
      description: "Guide pas à pas",
      sortOrder: 3,
      color: "#EC4899",
    },
    {
      key: "IMPORTANT",
      label: "Important",
      description: "Information cruciale",
      sortOrder: 4,
      color: "#DC2626",
    },
    {
      key: "RESSOURCES",
      label: "Ressources",
      description: "Gestion des ressources",
      sortOrder: 5,
      color: "#059669",
    },
    {
      key: "COMBAT",
      label: "Combat",
      description: "Stratégies de combat",
      sortOrder: 6,
      color: "#991B1B",
    },
    {
      key: "CONSTRUCTION",
      label: "Construction",
      description: "Développement de base",
      sortOrder: 7,
      color: "#92400E",
    },
    {
      key: "COORDINATION",
      label: "Coordination",
      description: "Travail d'équipe",
      sortOrder: 8,
      color: "#8B5CF6",
    },
  ];

  for (const tag of helpTags) {
    await prisma.referenceData.upsert({
      where: {
        category_key: { category: "HELP_TAG", key: tag.key },
      },
      update: {},
      create: {
        category: "HELP_TAG",
        key: tag.key,
        label: tag.label,
        description: tag.description,
        color: tag.color,
        sortOrder: tag.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // Articles d'aide de démonstration
  const helpArticles = [
    {
      title: "Guide de démarrage - Bases du jeu",
      slug: "guide-demarrage-bases",
      content: `# Guide de démarrage Last War

Bienvenue dans Last War ! Ce guide vous aidera à débuter dans le jeu.

## Premier lancement

Lorsque vous lancez le jeu pour la première fois :
- **Créez votre base** : Choisissez un nom unique
- **Suivez le tutoriel** : Ne sautez pas les étapes
- **Rejoignez une alliance** : Essentiel pour progresser

## Ressources de base

Les 4 ressources principales :
- **Métal** : Pour les bâtiments et unités
- **Huile** : Carburant pour les véhicules  
- **Cristaux** : Recherches avancées
- **Argent** : Commerce et upgrades

### Conseils de gestion

- Protégez vos ressources dans le bunker
- Collectez régulièrement vos productions
- Investissez dans l'amélioration des générateurs

## Premiers objectifs

1. Améliorer le Centre de Commandement niveau 10
2. Rejoindre une alliance active
3. Compléter les missions quotidiennes
4. Participer aux événements débutants`,
      excerpt:
        "Guide complet pour bien débuter dans Last War - ressources, alliance, premiers objectifs.",
      category: "GAME_BASICS",
      tags: ["débutant", "tutoriel", "ressources"],
      priority: 2,
      isFeatured: true,
      isPublished: true,
    },
    {
      title: "Stratégies de développement de base",
      slug: "strategies-developpement-base",
      content: `# Développement optimisé de votre base

## Priorités de construction

### Phase 1 : Bases solides (CC 1-15)
- **Centre de Commandement** : Toujours en priorité
- **Générateurs de ressources** : Équilibrez les 4 types
- **Entrepôts** : Protégez vos ressources
- **Casernes** : Capacité d'armée suffisante

### Phase 2 : Expansion (CC 16-25)
- **Centre de recherche** : Technologies clés
- **Hôpital** : Réduire les pertes
- **Mur d'enceinte** : Défense de base
- **Arsenal** : Amélioration des équipements

## Technologies prioritaires

1. **Économie** : Production +20%
2. **Armée** : Capacité et vitesse
3. **Défense** : Résistance aux attaques
4. **Alliance** : Bonus de coopération

## Gestion des ressources

- **Règle 80/20** : 80% protégé, 20% disponible
- **Production continue** : Ne jamais arrêter
- **Commerce intelligent** : Échangez vos surplus`,
      excerpt:
        "Optimisez le développement de votre base avec ces stratégies éprouvées.",
      category: "STRATEGY",
      tags: ["développement", "base", "optimisation"],
      priority: 1,
      isFeatured: true,
      isPublished: true,
    },
    {
      title: "Guide des Trains d'Alliance",
      slug: "guide-trains-alliance",
      content: `# Système de Trains d'Alliance

## Qu'est-ce qu'un train ?

Un train d'alliance permet de **rassembler plusieurs membres** pour des attaques coordonnées contre des cibles puissantes.

## Rôles dans un train

### Conducteur
- **Responsabilités** : Dirige le train, choisit la cible
- **Prérequis** : Expérience, niveau élevé
- **Horaires** : 8h00, 14h00, 20h00

### Passagers  
- **Maximum** : 4 passagers par train
- **Participation** : Suivent les ordres du conducteur
- **Récompenses** : Partagées selon la contribution

## Comment participer

1. **Consultez** la planification hebdomadaire
2. **Inscrivez-vous** aux créneaux disponibles
3. **Préparez** vos troupes et équipements
4. **Suivez** les instructions du conducteur

## Conseils pour réussir

- **Communication** : Discord obligatoire
- **Ponctualité** : Soyez à l'heure
- **Préparation** : Troupes soignées et équipées
- **Coordination** : Attaquez ensemble`,
      excerpt:
        "Tout savoir sur le système de trains d'alliance pour maximiser vos gains.",
      category: "TRAINS",
      tags: ["trains", "alliance", "coordination"],
      priority: 1,
      isFeatured: false,
      isPublished: true,
    },
    {
      title: "Événements Alliance - Participation optimale",
      slug: "evenements-alliance-participation",
      content: `# Maximiser sa participation aux événements

## Types d'événements majeurs

### Guerre d'Alliance
- **Durée** : 3 jours
- **Objectif** : Détruire la base ennemie
- **Stratégie** : Coordination massive requise

### Combat de Boss
- **Fréquence** : Hebdomadaire  
- **Récompenses** : Équipements légendaires
- **Tactique** : Attaques groupées synchronisées

## Préparation optimale

### Avant l'événement
- Soigner toutes les troupes
- Préparer les équipements
- Stocker les ressources nécessaires
- Coordonner avec l'alliance

### Pendant l'événement
- Respecter les consignes
- Communiquer en temps réel
- Adapter sa stratégie
- Soutenir les alliés

## Récompenses et progression

Les événements offrent :
- **Équipements rares**
- **Ressources bonus**
- **Points d'alliance**
- **Expérience de commandant**`,
      excerpt: "Stratégies pour exceller dans tous les événements d'alliance.",
      category: "EVENTS",
      tags: ["événements", "stratégie", "récompenses"],
      priority: 0,
      isFeatured: false,
      isPublished: true,
    },
    {
      title: "FAQ - Questions fréquentes",
      slug: "faq-questions-frequentes",
      content: `# Questions fréquemment posées

## Général

### Comment rejoindre l'alliance Frenchoy ?
Utilisez le code d'invitation fourni par un membre ou demandez sur Discord.

### Puis-je changer de serveur ?
Non, le changement de serveur n'est pas possible dans Last War.

### Comment récupérer un compte perdu ?
Contactez le support avec vos informations de compte.

## Gameplay

### Mes troupes disparaissent, pourquoi ?
- Vérifiez l'hôpital pour les blessés
- Consultez les rapports de combat
- Assurez-vous d'avoir de la nourriture

### Comment améliorer ma puissance rapidement ?
1. Améliorez les bâtiments principaux
2. Recherchez les technologies
3. Entraînez plus de troupes
4. Équipez de meilleurs objets

### Quand puis-je participer aux trains ?
Dès que vous atteignez le niveau 15 et rejoignez l'alliance.

## Alliance

### Comment obtenir plus d'aide d'alliance ?
- Aidez régulièrement les autres
- Participez aux événements
- Soyez actif sur Discord

### Puis-je être officier ?
Les promotions se basent sur l'activité, la fiabilité et l'ancienneté.`,
      excerpt: "Réponses aux questions les plus courantes des membres.",
      category: "FAQ",
      tags: ["faq", "aide", "questions"],
      priority: 0,
      isFeatured: false,
      isPublished: true,
    },
  ];

  // Utiliser l'email admin de l'environnement
  const adminEmail = "admin@beben0.com";
  const adminId = "admin-seed-id";

  for (const article of helpArticles) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        category: article.category as any,
        tags: article.tags,
        priority: article.priority,
        isFeatured: article.isFeatured,
        isPublished: article.isPublished,
        publishedAt: article.isPublished ? new Date() : null,
      },
      create: {
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        category: article.category as any,
        tags: article.tags,
        priority: article.priority,
        isFeatured: article.isFeatured,
        isPublished: article.isPublished,
        authorId: adminId,
        authorEmail: adminEmail,
        publishedAt: article.isPublished ? new Date() : null,
      },
    });
  }

  // Ajouter les permissions d'aide
  const helpPermissions = [
    { roleType: "ADMIN", permission: "view_help" },
    { roleType: "ADMIN", permission: "create_help_article" },
    { roleType: "ADMIN", permission: "edit_help_article" },
    { roleType: "ADMIN", permission: "delete_help_article" },
    { roleType: "ADMIN", permission: "publish_help_article" },
    { roleType: "ADMIN", permission: "manage_help_categories" },
    { roleType: "GUEST", permission: "view_help" },
  ];

  for (const perm of helpPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleType_permission: {
          roleType: perm.roleType,
          permission: perm.permission,
        },
      },
      update: { isEnabled: true },
      create: {
        roleType: perm.roleType,
        permission: perm.permission,
        isEnabled: true,
      },
    });
  }

  console.log("✅ Help articles seeded successfully!");
  console.log(`📚 Created ${helpArticles.length} help articles`);
  console.log(`🔐 Added ${helpPermissions.length} help permissions`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding help articles:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
