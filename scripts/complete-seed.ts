import { ArticleStatus, HelpCategory, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Complete seeding database...");

  // 1. Créer TOUTES les données de référence (incluant aide)
  console.log("📝 Creating reference data...");

  // 1.1 Spécialités des membres
  const memberSpecialties = [
    {
      key: "TANK",
      label: "Tank",
      description: "Spécialisé dans la défense et les points de vie",
      sortOrder: 1,
    },
    {
      key: "SNIPER",
      label: "Sniper",
      description: "Spécialisé dans les dégâts à distance",
      sortOrder: 2,
    },
    {
      key: "FARMER",
      label: "Farmer",
      description: "Spécialisé dans la production de ressources",
      sortOrder: 3,
    },
    {
      key: "DEFENSE",
      label: "Défense",
      description: "Spécialisé dans la protection de la base",
      sortOrder: 4,
    },
    {
      key: "SUPPORT",
      label: "Support",
      description: "Spécialisé dans le soutien de l'équipe",
      sortOrder: 5,
    },
    {
      key: "SCOUT",
      label: "Éclaireur",
      description: "Spécialisé dans la reconnaissance",
      sortOrder: 6,
    },
    {
      key: "ROOKIE",
      label: "Débutant",
      description: "Nouveau membre en apprentissage",
      sortOrder: 7,
    },
  ];

  for (const specialty of memberSpecialties) {
    await prisma.referenceData.upsert({
      where: {
        category_key: { category: "MEMBER_SPECIALTY", key: specialty.key },
      },
      update: {},
      create: {
        category: "MEMBER_SPECIALTY",
        key: specialty.key,
        label: specialty.label,
        description: specialty.description,
        sortOrder: specialty.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // 1.2 Tags des membres
  const memberTags = [
    {
      key: "VETERAN",
      label: "Vétéran",
      description: "Membre expérimenté",
      sortOrder: 1,
      color: "#10B981",
    },
    {
      key: "NEW",
      label: "Nouveau",
      description: "Nouveau membre",
      sortOrder: 2,
      color: "#3B82F6",
    },
    {
      key: "ACTIVE",
      label: "Actif",
      description: "Membre très actif",
      sortOrder: 3,
      color: "#22C55E",
    },
    {
      key: "INACTIVE",
      label: "Inactif",
      description: "Membre peu actif",
      sortOrder: 4,
      color: "#EF4444",
    },
    {
      key: "PVP",
      label: "PvP",
      description: "Spécialisé PvP",
      sortOrder: 5,
      color: "#DC2626",
    },
    {
      key: "TRAINING",
      label: "Formation",
      description: "En formation",
      sortOrder: 6,
      color: "#F59E0B",
    },
    {
      key: "LEADERSHIP",
      label: "Leadership",
      description: "Potentiel de leadership",
      sortOrder: 7,
      color: "#8B5CF6",
    },
    {
      key: "RELIABLE",
      label: "Fiable",
      description: "Très fiable",
      sortOrder: 8,
      color: "#059669",
    },
  ];

  for (const tag of memberTags) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "MEMBER_TAG", key: tag.key } },
      update: {},
      create: {
        category: "MEMBER_TAG",
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

  // 1.3 Rôles d'alliance
  const allianceRoles = [
    {
      key: "R5",
      label: "R5 - Leader",
      description: "Leader de l'alliance",
      sortOrder: 1,
      color: "#DC2626",
    },
    {
      key: "R4",
      label: "R4 - Officier",
      description: "Officier de l'alliance",
      sortOrder: 2,
      color: "#F59E0B",
    },
    {
      key: "MEMBER",
      label: "Membre",
      description: "Membre standard",
      sortOrder: 3,
      color: "#6B7280",
    },
  ];

  for (const role of allianceRoles) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "ALLIANCE_ROLE", key: role.key } },
      update: {},
      create: {
        category: "ALLIANCE_ROLE",
        key: role.key,
        label: role.label,
        description: role.description,
        color: role.color,
        sortOrder: role.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // 1.4 Types d'événements
  const eventTypes = [
    {
      key: "ALLIANCE_WAR",
      label: "Guerre d'Alliance",
      description: "Guerre contre une autre alliance",
      sortOrder: 1,
      color: "#DC2626",
    },
    {
      key: "BOSS_FIGHT",
      label: "Combat de Boss",
      description: "Combat contre un boss d'alliance",
      sortOrder: 2,
      color: "#7C2D12",
    },
    {
      key: "SERVER_WAR",
      label: "Guerre de Serveur",
      description: "Guerre cross-server",
      sortOrder: 3,
      color: "#991B1B",
    },
    {
      key: "SEASONAL",
      label: "Événement Saisonnier",
      description: "Événement spécial saisonnier",
      sortOrder: 4,
      color: "#059669",
    },
    {
      key: "FORMATION",
      label: "Formation",
      description: "Session de formation",
      sortOrder: 5,
      color: "#3B82F6",
    },
    {
      key: "REUNION",
      label: "Réunion",
      description: "Réunion d'alliance",
      sortOrder: 6,
      color: "#8B5CF6",
    },
    {
      key: "MAINTENANCE",
      label: "Maintenance",
      description: "Maintenance programmée",
      sortOrder: 7,
      color: "#6B7280",
    },
    {
      key: "EVENT_SPECIAL",
      label: "Événement Spécial",
      description: "Événement spécial unique",
      sortOrder: 8,
      color: "#F59E0B",
    },
    {
      key: "AUTRE",
      label: "Autre",
      description: "Autre type d'événement",
      sortOrder: 9,
      color: "#6B7280",
    },
  ];

  for (const eventType of eventTypes) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "EVENT_TYPE", key: eventType.key } },
      update: {},
      create: {
        category: "EVENT_TYPE",
        key: eventType.key,
        label: eventType.label,
        description: eventType.description,
        color: eventType.color,
        sortOrder: eventType.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // 1.5 🆕 NOUVELLES CATÉGORIES D'AIDE
  console.log("📚 Creating help system reference data...");

  // Catégories d'aide
  const helpCategories = [
    {
      key: "game_basics",
      label: "Bases du jeu",
      description: "Informations de base sur Last War",
      sortOrder: 1,
      color: "#3B82F6",
    },
    {
      key: "strategies",
      label: "Stratégies",
      description: "Stratégies avancées et tactiques",
      sortOrder: 2,
      color: "#8B5CF6",
    },
    {
      key: "alliance",
      label: "Alliance",
      description: "Gestion et fonctionnement de l'alliance",
      sortOrder: 3,
      color: "#10B981",
    },
    {
      key: "trains",
      label: "Trains",
      description: "Système de trains d'alliance",
      sortOrder: 4,
      color: "#F59E0B",
    },
    {
      key: "events",
      label: "Événements",
      description: "Événements de jeu et d'alliance",
      sortOrder: 5,
      color: "#EF4444",
    },
    {
      key: "tips",
      label: "Astuces",
      description: "Conseils et astuces utiles",
      sortOrder: 6,
      color: "#06B6D4",
    },
    {
      key: "faq",
      label: "FAQ",
      description: "Questions fréquemment posées",
      sortOrder: 7,
      color: "#84CC16",
    },
    {
      key: "tutorials",
      label: "Tutoriels",
      description: "Guides pas à pas",
      sortOrder: 8,
      color: "#F97316",
    },
    {
      key: "advanced",
      label: "Avancé",
      description: "Contenu pour joueurs expérimentés",
      sortOrder: 9,
      color: "#DC2626",
    },
  ];

  for (const category of helpCategories) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "HELP_CATEGORY", key: category.key } },
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

  // Statuts d'aide
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
      label: "Révision",
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
      where: { category_key: { category: "HELP_STATUS", key: status.key } },
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

  // Tags d'aide
  const helpTags = [
    {
      key: "beginner",
      label: "Débutant",
      description: "Pour les nouveaux joueurs",
      sortOrder: 1,
      color: "#3B82F6",
    },
    {
      key: "advanced",
      label: "Avancé",
      description: "Pour les joueurs expérimentés",
      sortOrder: 2,
      color: "#DC2626",
    },
    {
      key: "tutorial",
      label: "Tutoriel",
      description: "Guide étape par étape",
      sortOrder: 3,
      color: "#10B981",
    },
    {
      key: "important",
      label: "Important",
      description: "Information cruciale",
      sortOrder: 4,
      color: "#EF4444",
    },
    {
      key: "resources",
      label: "Ressources",
      description: "Gestion des ressources",
      sortOrder: 5,
      color: "#F59E0B",
    },
    {
      key: "combat",
      label: "Combat",
      description: "Stratégies de combat",
      sortOrder: 6,
      color: "#7C2D12",
    },
    {
      key: "building",
      label: "Construction",
      description: "Construction et développement",
      sortOrder: 7,
      color: "#059669",
    },
    {
      key: "coordination",
      label: "Coordination",
      description: "Coordination d'alliance",
      sortOrder: 8,
      color: "#8B5CF6",
    },
  ];

  for (const tag of helpTags) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "HELP_TAG", key: tag.key } },
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

  console.log("✅ All reference data created (including help system)");

  // 2. Créer admin par défaut
  console.log("👤 Creating admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@beben0.com" },
    update: {},
    create: {
      email: "admin@beben0.com",
      pseudo: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      allianceRole: "R5",
    },
  });

  console.log("✅ Admin user created:", admin.email, "/ password: admin123");

  // 3. Note: Permissions par défaut peuvent être initialisées via l'interface admin
  console.log("ℹ️ Default permissions can be initialized via admin interface");

  // 4. Créer membres de démonstration
  console.log("👥 Creating demo members...");
  const demoMembers = [
    {
      pseudo: "DragonSlayer",
      level: 45,
      power: 2850000n,
      kills: 1250,
      specialty: "SNIPER",
      allianceRole: "R5" as const,
      tags: ["VETERAN", "PVP"],
    },
    {
      pseudo: "IronFist",
      level: 42,
      power: 2650000n,
      kills: 980,
      specialty: "TANK",
      allianceRole: "R4" as const,
      tags: ["VETERAN", "RELIABLE"],
    },
    {
      pseudo: "ShadowHunter",
      level: 40,
      power: 2400000n,
      kills: 845,
      specialty: "SNIPER",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE", "PVP"],
    },
    {
      pseudo: "FireStorm",
      level: 38,
      power: 2200000n,
      kills: 720,
      specialty: "FARMER",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE", "RELIABLE"],
    },
    {
      pseudo: "ThunderBolt",
      level: 41,
      power: 2550000n,
      kills: 1100,
      specialty: "DEFENSE",
      allianceRole: "MEMBER" as const,
      tags: ["VETERAN", "RELIABLE"],
    },
  ];

  for (const memberData of demoMembers) {
    await prisma.member.upsert({
      where: { pseudo: memberData.pseudo },
      update: {},
      create: memberData,
    });
  }

  console.log(`✅ Created ${demoMembers.length} demo members`);

  // 5. Créer créneaux de trains
  console.log("🚂 Creating train slots...");
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const defaultTime = "20:00";

  for (const day of days) {
    await prisma.trainSlot.upsert({
      where: { day: day },
      update: {},
      create: { day, departureTime: defaultTime },
    });
  }

  console.log("✅ Created train slots for the week");

  // 6. 🆕 Créer articles d'aide de démonstration
  console.log("📚 Creating demo help articles...");
  const demoArticles = [
    {
      title: "Guide de démarrage - Les bases",
      slug: "guide-demarrage-bases",
      content: `# Guide de démarrage pour Last War

## Bienvenue dans l'alliance !

Ce guide vous aidera à comprendre les bases de Last War et comment bien commencer dans notre alliance.

### 1. Premiers pas
- Suivez le tutoriel du jeu
- Rejoignez notre chat alliance
- Lisez les règles de l'alliance

### 2. Développement de base
- **Priorité 1** : Centre de commandement
- **Priorité 2** : Ressources (pétrole, électricité, acier)
- **Priorité 3** : Défenses

### 3. Recherches importantes
1. Technologie militaire
2. Économie
3. Défense

### 4. Rejoindre les trains
Les trains d'alliance sont essentiels pour votre progression. Consultez la section trains pour vous inscrire.

**Bon jeu et bienvenue dans l'alliance !**`,
      excerpt:
        "Guide essentiel pour bien commencer dans Last War et notre alliance",
      category: HelpCategory.GAME_BASICS,
      tags: ["beginner", "tutorial", "important"],
      status: ArticleStatus.PUBLISHED,
      priority: 2,
      isPublished: true,
      isFeatured: true,
      authorId: admin.id,
      authorEmail: admin.email,
      publishedAt: new Date(),
    },
    {
      title: "Système de trains d'alliance",
      slug: "systeme-trains-alliance",
      content: `# Système de trains d'alliance

## Qu'est-ce qu'un train d'alliance ?

Les trains sont des sessions coopératives où les membres s'entraident pour progresser ensemble.

### Planning des trains
- **Lundi** : Train ressources
- **Mardi** : Train construction
- **Mercredi** : Train recherche
- **Jeudi** : Train militaire
- **Vendredi** : Train libre
- **Samedi** : Train de guerre
- **Dimanche** : Repos

### Comment participer
1. Consultez le planning sur le site
2. Inscrivez-vous au train souhaité
3. Soyez présent à l'heure
4. Suivez les consignes du conducteur

### Règles importantes
- Respect des horaires
- Écoute du conducteur
- Aide mutuelle
- Pas d'abandon en cours de route`,
      excerpt:
        "Tout savoir sur le système de trains d'alliance et comment y participer",
      category: HelpCategory.TRAINS,
      tags: ["coordination", "important"],
      status: ArticleStatus.PUBLISHED,
      priority: 1,
      isPublished: true,
      isFeatured: true,
      authorId: admin.id,
      authorEmail: admin.email,
      publishedAt: new Date(),
    },
  ];

  for (const article of demoArticles) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }

  console.log(`✅ Created ${demoArticles.length} demo help articles`);

  console.log("");
  console.log("🎉 Complete seeding finished!");
  console.log("");
  console.log("📧 Admin login: admin@beben0.com");
  console.log("🔑 Admin password: admin123");
  console.log("📚 Help system ready with demo articles");
  console.log("🔐 Permissions system initialized");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
