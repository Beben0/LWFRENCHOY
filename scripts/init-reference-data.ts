import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_REFERENCE_DATA = [
  // Nouveaux types d'événements
  {
    category: "EVENT_TYPE",
    key: "GUERRE_ALLIANCE",
    label: "Guerre Alliance",
    color: "#dc2626",
    icon: "sword",
    sortOrder: 5,
    isActive: true,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "EVENT_SPECIAL",
    label: "Événement Spécial",
    color: "#a855f7",
    icon: "star",
    sortOrder: 6,
    isActive: true,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "MAINTENANCE",
    label: "Maintenance",
    color: "#6b7280",
    icon: "settings",
    sortOrder: 7,
    isActive: true,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "FORMATION",
    label: "Formation",
    color: "#10b981",
    icon: "users",
    sortOrder: 8,
    isActive: true,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "REUNION",
    label: "Réunion",
    color: "#0ea5e9",
    icon: "calendar",
    sortOrder: 9,
    isActive: true,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "AUTRE",
    label: "Autre",
    color: "#64748b",
    icon: "more-horizontal",
    sortOrder: 10,
    isActive: true,
    isSystem: true,
  },

  // Nouveaux tags d'événements
  {
    category: "EVENT_TAG",
    key: "obligatoire",
    label: "Obligatoire",
    color: "#dc2626",
    sortOrder: 6,
    isActive: true,
    isSystem: false,
  },
  {
    category: "EVENT_TAG",
    key: "preparation",
    label: "Préparation",
    color: "#8b5cf6",
    sortOrder: 7,
    isActive: true,
    isSystem: false,
  },
  {
    category: "EVENT_TAG",
    key: "recompense",
    label: "Récompense",
    color: "#f59e0b",
    sortOrder: 8,
    isActive: true,
    isSystem: false,
  },
  {
    category: "EVENT_TAG",
    key: "entrainement",
    label: "Entraînement",
    color: "#06b6d4",
    sortOrder: 9,
    isActive: true,
    isSystem: false,
  },
  {
    category: "EVENT_TAG",
    key: "planification",
    label: "Planification",
    color: "#6366f1",
    sortOrder: 10,
    isActive: true,
    isSystem: false,
  },
] as const;

async function main() {
  console.log("🚀 Initialisation des nouvelles données de référence...");

  for (const data of NEW_REFERENCE_DATA) {
    try {
      // Vérifier si la donnée existe déjà
      const existing = await prisma.referenceData.findFirst({
        where: {
          category: data.category,
          key: data.key,
        },
      });

      if (!existing) {
        await prisma.referenceData.create({
          data: data,
        });
        console.log(`✅ Créé: ${data.category} - ${data.label}`);
      } else {
        console.log(`⏭️  Existe déjà: ${data.category} - ${data.label}`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${data.category} - ${data.label}:`, error);
    }
  }

  console.log("✨ Initialisation terminée!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur générale:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
