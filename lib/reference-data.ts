import { ReferenceCategory } from "@prisma/client";
import { prisma } from "./prisma";

export interface ReferenceDataItem {
  id?: string;
  category: ReferenceCategory;
  key: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  isSystem?: boolean;
  metadata?: any;
}

// Données par défaut pour initialiser le système
const DEFAULT_REFERENCE_DATA: ReferenceDataItem[] = [
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
  {
    category: "EVENT_TYPE",
    key: "GUERRE_ALLIANCE",
    label: "Guerre Alliance",
    color: "#dc2626",
    icon: "sword",
    sortOrder: 5,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "EVENT_SPECIAL",
    label: "Événement Spécial",
    color: "#a855f7",
    icon: "star",
    sortOrder: 6,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "MAINTENANCE",
    label: "Maintenance",
    color: "#6b7280",
    icon: "settings",
    sortOrder: 7,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "FORMATION",
    label: "Formation",
    color: "#10b981",
    icon: "users",
    sortOrder: 8,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "REUNION",
    label: "Réunion",
    color: "#0ea5e9",
    icon: "calendar",
    sortOrder: 9,
    isSystem: true,
  },
  {
    category: "EVENT_TYPE",
    key: "AUTRE",
    label: "Autre",
    color: "#64748b",
    icon: "more-horizontal",
    sortOrder: 10,
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
  {
    category: "EVENT_TAG",
    key: "obligatoire",
    label: "Obligatoire",
    color: "#dc2626",
    sortOrder: 6,
  },
  {
    category: "EVENT_TAG",
    key: "preparation",
    label: "Préparation",
    color: "#8b5cf6",
    sortOrder: 7,
  },
  {
    category: "EVENT_TAG",
    key: "recompense",
    label: "Récompense",
    color: "#f59e0b",
    sortOrder: 8,
  },
  {
    category: "EVENT_TAG",
    key: "entrainement",
    label: "Entraînement",
    color: "#06b6d4",
    sortOrder: 9,
  },
  {
    category: "EVENT_TAG",
    key: "planification",
    label: "Planification",
    color: "#6366f1",
    sortOrder: 10,
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

// Initialiser les données par défaut
export async function initializeDefaultReferenceData(): Promise<void> {
  try {
    const existingCount = await prisma.referenceData.count();

    if (existingCount === 0) {
      console.log("Initialisation des données de référence par défaut...");

      await prisma.referenceData.createMany({
        data: DEFAULT_REFERENCE_DATA,
        skipDuplicates: true,
      });

      console.log("Données de référence initialisées avec succès.");
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation des données de référence:",
      error
    );
  }
}

// Obtenir toutes les données pour une catégorie
export async function getReferenceDataByCategory(
  category: ReferenceCategory,
  activeOnly: boolean = true
) {
  return await prisma.referenceData.findMany({
    where: {
      category,
      ...(activeOnly && { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

// Obtenir toutes les catégories disponibles
export async function getAllReferenceCategories() {
  const categories = await prisma.referenceData.groupBy({
    by: ["category"],
    _count: {
      id: true,
    },
    orderBy: {
      category: "asc",
    },
  });

  return categories.map((cat) => ({
    category: cat.category,
    count: cat._count.id,
  }));
}

// Créer une nouvelle donnée de référence
export async function createReferenceData(data: Omit<ReferenceDataItem, "id">) {
  return await prisma.referenceData.create({
    data,
  });
}

// Mettre à jour une donnée de référence
export async function updateReferenceData(
  id: string,
  data: Partial<ReferenceDataItem>
) {
  return await prisma.referenceData.update({
    where: { id },
    data,
  });
}

// Supprimer une donnée de référence (sauf si système)
export async function deleteReferenceData(id: string) {
  const item = await prisma.referenceData.findUnique({
    where: { id },
    select: { isSystem: true },
  });

  if (item?.isSystem) {
    throw new Error("Impossible de supprimer une donnée système");
  }

  return await prisma.referenceData.delete({
    where: { id },
  });
}

// Réorganiser l'ordre des éléments
export async function reorderReferenceData(
  category: ReferenceCategory,
  orderedIds: string[]
) {
  const updates = orderedIds.map((id, index) =>
    prisma.referenceData.update({
      where: { id },
      data: { sortOrder: index + 1 },
    })
  );

  await prisma.$transaction(updates);
}

// Obtenir les options pour un select/dropdown
export async function getReferenceOptions(category: ReferenceCategory) {
  const items = await getReferenceDataByCategory(category);
  return items.map((item) => ({
    value: item.key,
    label: item.label,
    color: item.color,
    icon: item.icon,
  }));
}

// Obtenir le libellé d'une clé
export async function getReferenceLabel(
  category: ReferenceCategory,
  key: string
): Promise<string> {
  const item = await prisma.referenceData.findUnique({
    where: {
      category_key: {
        category,
        key,
      },
    },
    select: { label: true },
  });

  return item?.label || key;
}

// Vérifier si une clé existe déjà
export async function isReferenceKeyExists(
  category: ReferenceCategory,
  key: string,
  excludeId?: string
): Promise<boolean> {
  const count = await prisma.referenceData.count({
    where: {
      category,
      key,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  return count > 0;
}
