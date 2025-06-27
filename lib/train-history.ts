import { prisma } from "@/lib/prisma";

export type TrainAction =
  | "CONDUCTOR_ASSIGNED"
  | "CONDUCTOR_REMOVED"
  | "PASSENGER_JOINED"
  | "PASSENGER_LEFT"
  | "TIME_CHANGED"
  | "TRAIN_CREATED"
  | "TRAIN_DELETED"
  | "TRAIN_VALIDATED"
  | "TRAIN_UNVALIDATED";

interface LogTrainActionParams {
  trainSlotId: string;
  action: TrainAction;
  actorId?: string;
  actorPseudo?: string;
  targetId?: string;
  targetPseudo?: string;
  details?: string;
}

// Log une action sur un train
export async function logTrainAction({
  trainSlotId,
  action,
  actorId,
  actorPseudo,
  targetId,
  targetPseudo,
  details,
}: LogTrainActionParams) {
  try {
    await prisma.trainHistory.create({
      data: {
        trainSlotId,
        action,
        actorId,
        actorPseudo,
        targetId,
        targetPseudo,
        details,
      },
    });
  } catch (error) {
    console.error("Error logging train action:", error);
  }
}

// Récupérer l'historique d'un train spécifique
export async function getTrainHistory(trainSlotId: string) {
  return await prisma.trainHistory.findMany({
    where: { trainSlotId },
    orderBy: { timestamp: "desc" },
  });
}

// Récupérer l'historique global des trains
export async function getGlobalTrainHistory(limit = 50) {
  return await prisma.trainHistory.findMany({
    include: {
      trainSlot: {
        select: {
          day: true,
          departureTime: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

// Récupérer les statistiques d'un conducteur
export async function getConductorStats(memberId: string) {
  const [assignedCount, totalHistory] = await Promise.all([
    // Nombre de fois assigné comme conducteur
    prisma.trainHistory.count({
      where: {
        targetId: memberId,
        action: "CONDUCTOR_ASSIGNED",
      },
    }),
    // Historique complet des actions liées à ce membre
    prisma.trainHistory.findMany({
      where: {
        OR: [{ targetId: memberId }, { actorId: memberId }],
      },
      include: {
        trainSlot: {
          select: {
            day: true,
            departureTime: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  return {
    assignedCount,
    totalHistory,
  };
}

// Récupérer le classement des conducteurs avec dates
export async function getConductorRanking() {
  const conductors = await prisma.trainHistory.groupBy({
    by: ["targetPseudo", "targetId"],
    where: {
      action: "CONDUCTOR_ASSIGNED",
      targetId: { not: null },
    },
    _count: {
      id: true,
    },
  });

  // Récupérer la dernière date pour chaque conducteur
  const conductorRanking = await Promise.all(
    conductors.map(async (conductor: any) => {
      const lastAssignment = await prisma.trainHistory.findFirst({
        where: {
          targetId: conductor.targetId,
          action: "CONDUCTOR_ASSIGNED",
        },
        orderBy: { timestamp: "desc" },
        include: {
          trainSlot: {
            select: {
              day: true,
              departureTime: true,
            },
          },
        },
      });

      return {
        pseudo: conductor.targetPseudo || "Inconnu",
        targetId: conductor.targetId,
        count: conductor._count.id,
        lastDate: lastAssignment?.timestamp || null,
        lastTrain: lastAssignment?.trainSlot || null,
      };
    })
  );

  return conductorRanking.sort((a: any, b: any) => b.count - a.count);
}

// Formater les actions pour l'affichage
export function formatTrainAction(action: TrainAction): string {
  const actionLabels: Record<TrainAction, string> = {
    CONDUCTOR_ASSIGNED: "Conducteur assigné",
    CONDUCTOR_REMOVED: "Conducteur retiré",
    PASSENGER_JOINED: "Passager ajouté",
    PASSENGER_LEFT: "Passager parti",
    TIME_CHANGED: "Horaire modifié",
    TRAIN_CREATED: "Train créé",
    TRAIN_DELETED: "Train supprimé",
    TRAIN_VALIDATED: "Train validé",
    TRAIN_UNVALIDATED: "Train invalidé",
  };

  return actionLabels[action] || action;
}

// Formater l'historique pour l'affichage
export function formatHistoryEntry(entry: any): string {
  const action = formatTrainAction(entry.action);
  const actor = entry.actorPseudo || "Système";
  const target = entry.targetPseudo;
  const details = entry.details;

  switch (entry.action) {
    case "CONDUCTOR_ASSIGNED":
      return `${actor} a assigné ${target} comme conducteur`;
    case "CONDUCTOR_REMOVED":
      return `${actor} a retiré ${target} de la conduite`;
    case "PASSENGER_JOINED":
      return `${target} a rejoint le train`;
    case "PASSENGER_LEFT":
      return `${target} a quitté le train`;
    case "TIME_CHANGED":
      return `${actor} a modifié l'horaire${details ? ` (${details})` : ""}`;
    case "TRAIN_CREATED":
      return `${actor} a créé le train`;
    case "TRAIN_DELETED":
      return `${actor} a supprimé le train`;
    case "TRAIN_VALIDATED":
      return `${actor} a validé le train`;
    case "TRAIN_UNVALIDATED":
      return `${actor} a invalidé le train`;
    default:
      return `${actor} - ${action}${target ? ` - ${target}` : ""}`;
  }
}
