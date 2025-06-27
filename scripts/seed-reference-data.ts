import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Initialisation des données de référence...");

  // Supprimer les données existantes
  await prisma.referenceData.deleteMany({});

  // Données par défaut
  const referenceData = [
    // Spécialités des membres
    {
      category: "MEMBER_SPECIALTY",
      key: "sniper",
      label: "Sniper",
      color: "#ef4444",
      icon: "target",
      sortOrder: 1,
      isSystem: true,
    },
    {
      category: "MEMBER_SPECIALTY",
      key: "tank",
      label: "Tank",
      color: "#3b82f6",
      icon: "shield",
      sortOrder: 2,
      isSystem: true,
    },
    {
      category: "MEMBER_SPECIALTY",
      key: "support",
      label: "Support",
      color: "#10b981",
      icon: "heart",
      sortOrder: 3,
      isSystem: true,
    },
    {
      category: "MEMBER_SPECIALTY",
      key: "dps",
      label: "DPS",
      color: "#f59e0b",
      icon: "zap",
      sortOrder: 4,
      isSystem: true,
    },
    {
      category: "MEMBER_SPECIALTY",
      key: "scout",
      label: "Scout",
      color: "#8b5cf6",
      icon: "eye",
      sortOrder: 5,
      isSystem: true,
    },

    // Tags des membres
    {
      category: "MEMBER_TAG",
      key: "actif",
      label: "Actif",
      color: "#10b981",
      sortOrder: 1,
    },
    {
      category: "MEMBER_TAG",
      key: "veteran",
      label: "Vétéran",
      color: "#f59e0b",
      sortOrder: 2,
    },
    {
      category: "MEMBER_TAG",
      key: "nouveau",
      label: "Nouveau",
      color: "#3b82f6",
      sortOrder: 3,
    },
    {
      category: "MEMBER_TAG",
      key: "inactif",
      label: "Inactif",
      color: "#6b7280",
      sortOrder: 4,
    },
    {
      category: "MEMBER_TAG",
      key: "elite",
      label: "Elite",
      color: "#dc2626",
      sortOrder: 5,
    },

    // Rôles d'alliance
    {
      category: "ALLIANCE_ROLE",
      key: "R5",
      label: "R5 - Leader",
      color: "#dc2626",
      icon: "crown",
      sortOrder: 1,
      isSystem: true,
    },
    {
      category: "ALLIANCE_ROLE",
      key: "R4",
      label: "R4 - Co-Leader",
      color: "#f59e0b",
      icon: "star",
      sortOrder: 2,
      isSystem: true,
    },
    {
      category: "ALLIANCE_ROLE",
      key: "MEMBER",
      label: "Membre",
      color: "#3b82f6",
      icon: "user",
      sortOrder: 3,
      isSystem: true,
    },

    // Types d'événements
    {
      category: "EVENT_TYPE",
      key: "ALLIANCE_WAR",
      label: "Guerre d'Alliance",
      color: "#ef4444",
      icon: "sword",
      sortOrder: 1,
      isSystem: true,
    },
    {
      category: "EVENT_TYPE",
      key: "BOSS_FIGHT",
      label: "Boss d'Alliance",
      color: "#f59e0b",
      icon: "crown",
      sortOrder: 2,
      isSystem: true,
    },
    {
      category: "EVENT_TYPE",
      key: "SERVER_WAR",
      label: "Guerre de Serveur",
      color: "#3b82f6",
      icon: "server",
      sortOrder: 3,
      isSystem: true,
    },
    {
      category: "EVENT_TYPE",
      key: "SEASONAL",
      label: "Événement Saisonnier",
      color: "#8b5cf6",
      icon: "star",
      sortOrder: 4,
      isSystem: true,
    },

    // Tags des événements
    {
      category: "EVENT_TAG",
      key: "urgent",
      label: "Urgent",
      color: "#dc2626",
      sortOrder: 1,
    },
    {
      category: "EVENT_TAG",
      key: "important",
      label: "Important",
      color: "#f59e0b",
      sortOrder: 2,
    },
    {
      category: "EVENT_TAG",
      key: "optionnel",
      label: "Optionnel",
      color: "#10b981",
      sortOrder: 3,
    },
    {
      category: "EVENT_TAG",
      key: "pvp",
      label: "PvP",
      color: "#ef4444",
      sortOrder: 4,
    },
    {
      category: "EVENT_TAG",
      key: "pve",
      label: "PvE",
      color: "#3b82f6",
      sortOrder: 5,
    },

    // Niveaux de priorité
    {
      category: "PRIORITY_LEVEL",
      key: "very_high",
      label: "Très Haute",
      color: "#dc2626",
      sortOrder: 1,
    },
    {
      category: "PRIORITY_LEVEL",
      key: "high",
      label: "Haute",
      color: "#f59e0b",
      sortOrder: 2,
    },
    {
      category: "PRIORITY_LEVEL",
      key: "medium",
      label: "Moyenne",
      color: "#3b82f6",
      sortOrder: 3,
    },
    {
      category: "PRIORITY_LEVEL",
      key: "low",
      label: "Basse",
      color: "#10b981",
      sortOrder: 4,
    },

    // Types de statuts
    {
      category: "STATUS_TYPE",
      key: "active",
      label: "Actif",
      color: "#10b981",
      sortOrder: 1,
      isSystem: true,
    },
    {
      category: "STATUS_TYPE",
      key: "inactive",
      label: "Inactif",
      color: "#6b7280",
      sortOrder: 2,
      isSystem: true,
    },
  ];

  // Créer toutes les données
  for (const data of referenceData) {
    await prisma.referenceData.create({
      data: data as any,
    });
  }

  console.log(`✅ ${referenceData.length} données de référence créées`);

  // Afficher le résumé par catégorie
  const categories = await prisma.referenceData.groupBy({
    by: ["category"],
    _count: { id: true },
  });

  console.log("\n📊 Résumé par catégorie:");
  categories.forEach((cat) => {
    console.log(`  ${cat.category}: ${cat._count.id} éléments`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors de l'initialisation:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
