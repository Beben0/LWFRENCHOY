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

  console.log("✅ All reference data created");

  // 2. Créer admin par défaut
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

  // 3. Créer membres de démonstration
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

  // 4. Créer créneaux de trains
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

  console.log("🎉 Seeding completed!");
  console.log("");
  console.log("📧 Admin login: admin@beben0.com");
  console.log("🔑 Admin password: admin123");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
