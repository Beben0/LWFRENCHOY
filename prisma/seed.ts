import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Créer TOUTES les données de référence
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

  // 1.5 Tags d'événements
  const eventTags = [
    {
      key: "MANDATORY",
      label: "Obligatoire",
      description: "Participation obligatoire",
      sortOrder: 1,
      color: "#DC2626",
    },
    {
      key: "OPTIONAL",
      label: "Optionnel",
      description: "Participation optionnelle",
      sortOrder: 2,
      color: "#22C55E",
    },
    {
      key: "IMPORTANT",
      label: "Important",
      description: "Événement important",
      sortOrder: 3,
      color: "#F59E0B",
    },
    {
      key: "PREPARATION",
      label: "Préparation",
      description: "Phase de préparation",
      sortOrder: 4,
      color: "#3B82F6",
    },
    {
      key: "REWARD",
      label: "Récompenses",
      description: "Grosses récompenses",
      sortOrder: 5,
      color: "#8B5CF6",
    },
    {
      key: "PRACTICE",
      label: "Entraînement",
      description: "Session d'entraînement",
      sortOrder: 6,
      color: "#059669",
    },
  ];

  for (const tag of eventTags) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "EVENT_TAG", key: tag.key } },
      update: {},
      create: {
        category: "EVENT_TAG",
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

  // 1.6 Niveaux de priorité
  const priorityLevels = [
    {
      key: "LOW",
      label: "Basse",
      description: "Priorité basse",
      sortOrder: 1,
      color: "#22C55E",
    },
    {
      key: "MEDIUM",
      label: "Moyenne",
      description: "Priorité moyenne",
      sortOrder: 2,
      color: "#F59E0B",
    },
    {
      key: "HIGH",
      label: "Haute",
      description: "Priorité haute",
      sortOrder: 3,
      color: "#EF4444",
    },
    {
      key: "CRITICAL",
      label: "Critique",
      description: "Priorité critique",
      sortOrder: 4,
      color: "#DC2626",
    },
  ];

  for (const priority of priorityLevels) {
    await prisma.referenceData.upsert({
      where: {
        category_key: { category: "PRIORITY_LEVEL", key: priority.key },
      },
      update: {},
      create: {
        category: "PRIORITY_LEVEL",
        key: priority.key,
        label: priority.label,
        description: priority.description,
        color: priority.color,
        sortOrder: priority.sortOrder,
        isActive: true,
        isSystem: true,
      },
    });
  }

  // 1.7 Types de statuts
  const statusTypes = [
    {
      key: "ACTIVE",
      label: "Actif",
      description: "Élément actif",
      sortOrder: 1,
      color: "#22C55E",
    },
    {
      key: "INACTIVE",
      label: "Inactif",
      description: "Élément inactif",
      sortOrder: 2,
      color: "#6B7280",
    },
    {
      key: "PENDING",
      label: "En attente",
      description: "En cours de traitement",
      sortOrder: 3,
      color: "#F59E0B",
    },
    {
      key: "COMPLETED",
      label: "Terminé",
      description: "Traitement terminé",
      sortOrder: 4,
      color: "#059669",
    },
    {
      key: "CANCELLED",
      label: "Annulé",
      description: "Annulé",
      sortOrder: 5,
      color: "#EF4444",
    },
    {
      key: "EXPIRED",
      label: "Expiré",
      description: "Expiré",
      sortOrder: 6,
      color: "#9CA3AF",
    },
  ];

  for (const status of statusTypes) {
    await prisma.referenceData.upsert({
      where: { category_key: { category: "STATUS_TYPE", key: status.key } },
      update: {},
      create: {
        category: "STATUS_TYPE",
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

  console.log("✅ All reference data created");

  // 2. Initialiser les permissions par défaut pour les rôles
  const { initializeDefaultPermissions } = await import(
    "../lib/role-permissions"
  );
  await initializeDefaultPermissions();
  console.log("✅ Default role permissions initialized");

  // 3. Créer admin par défaut
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@alliance.gg" },
    update: {},
    create: {
      email: "admin@alliance.gg",
      pseudo: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      allianceRole: "R5", // Admin peut aussi avoir un rôle d'alliance
    },
  });

  console.log("✅ Admin user created:", admin.email);

  // 4. Créer membres de démonstration
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
    {
      pseudo: "PhoenixRising",
      level: 39,
      power: 2300000n,
      kills: 650,
      specialty: "SUPPORT",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE", "LEADERSHIP"],
    },
    {
      pseudo: "WolfPack",
      level: 37,
      power: 2000000n,
      kills: 580,
      specialty: "SCOUT",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE"],
    },
    {
      pseudo: "StormBreaker",
      level: 43,
      power: 2700000n,
      kills: 1050,
      specialty: "SNIPER",
      allianceRole: "MEMBER" as const,
      tags: ["VETERAN", "PVP"],
    },
    {
      pseudo: "NightMare",
      level: 36,
      power: 1850000n,
      kills: 420,
      specialty: "ROOKIE",
      allianceRole: "MEMBER" as const,
      tags: ["NEW", "TRAINING"],
    },
    {
      pseudo: "BladeRunner",
      level: 44,
      power: 2750000n,
      kills: 1180,
      specialty: "TANK",
      allianceRole: "MEMBER" as const,
      tags: ["VETERAN", "RELIABLE"],
    },
    {
      pseudo: "StarGazer",
      level: 35,
      power: 1700000n,
      kills: 380,
      specialty: "FARMER",
      allianceRole: "MEMBER" as const,
      tags: ["NEW", "ACTIVE"],
    },
    {
      pseudo: "IceQueen",
      level: 40,
      power: 2350000n,
      kills: 790,
      specialty: "DEFENSE",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE", "LEADERSHIP"],
    },
    {
      pseudo: "RocketLauncher",
      level: 41,
      power: 2450000n,
      kills: 920,
      specialty: "SUPPORT",
      allianceRole: "MEMBER" as const,
      tags: ["VETERAN", "RELIABLE"],
    },
    {
      pseudo: "GhostRider",
      level: 38,
      power: 2150000n,
      kills: 680,
      specialty: "SCOUT",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE"],
    },
    {
      pseudo: "CrimsonTide",
      level: 39,
      power: 2250000n,
      kills: 740,
      specialty: "SNIPER",
      allianceRole: "MEMBER" as const,
      tags: ["ACTIVE", "PVP"],
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

  // 5. Créer créneaux de trains pour la semaine (un seul créneau par jour)
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const defaultTime = "20:00"; // Heure par défaut

  for (const day of days) {
    await prisma.trainSlot.upsert({
      where: {
        day: day,
      },
      update: {},
      create: {
        day,
        departureTime: defaultTime,
      },
    });
  }

  console.log("✅ Created train slots for the week");

  // 6. Créer quelques événements de démonstration
  const events = [
    {
      title: "Guerre d'Alliance vs RedPhoenix",
      description: "Guerre importante - participation obligatoire",
      type: "ALLIANCE_WAR" as const,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // dans 2 jours
      endDate: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
      ), // 2h plus tard
    },
    {
      title: "Boss d'Alliance Level 15",
      description: "Tous les snipers et tanks requis",
      type: "BOSS_FIGHT" as const,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // demain
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1h plus tard
    },
    {
      title: "Guerre de Serveur",
      description: "Préparation pour la guerre cross-server",
      type: "SERVER_WAR" as const,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // dans 5 jours
      endDate: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000
      ), // 24h plus tard
    },
  ];

  for (const eventData of events) {
    await prisma.event.create({
      data: eventData,
    });
  }

  console.log("✅ Created demo events");

  // 7. Créer stats d'alliance initiales
  const totalMembers = await prisma.member.count();
  const totalPowerResult = await prisma.member.aggregate({
    _sum: {
      power: true,
    },
  });

  await prisma.allianceStats.create({
    data: {
      totalMembers,
      totalPower: totalPowerResult._sum.power || 0n,
      activeMembers: totalMembers,
      date: new Date(),
    },
  });

  console.log("✅ Created initial alliance stats");

  // 8. Seed Help Articles and VS demo data
  console.log("📚 Seeding help articles and VS data...");
  // Use require so ts-node handles .ts files even inside dynamic execution
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../scripts/seed-help-articles");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../scripts/seed-vs-data");
  console.log("✅ Help articles & VS data seeded");

  // 9. Seed Desert Storm demo data
  console.log("🏜️ Seeding Desert Storm data...");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../scripts/seed-desert-storm");
  console.log("✅ Desert Storm data seeded");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
