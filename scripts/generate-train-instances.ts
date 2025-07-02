import { PrismaClient, TrainStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface TrainTemplate {
  dayOfWeek: string;
  defaultTime: string;
  isRequired: boolean; // Train obligatoire (chaque jour) ou optionnel
}

// Configuration des trains par jour de la semaine
const TRAIN_TEMPLATES: TrainTemplate[] = [
  { dayOfWeek: "monday", defaultTime: "20:00", isRequired: true },
  { dayOfWeek: "tuesday", defaultTime: "20:00", isRequired: true },
  { dayOfWeek: "wednesday", defaultTime: "20:00", isRequired: true },
  { dayOfWeek: "thursday", defaultTime: "20:00", isRequired: true },
  { dayOfWeek: "friday", defaultTime: "20:00", isRequired: true },
  { dayOfWeek: "saturday", defaultTime: "14:00", isRequired: false }, // Weekend, plus flexible
  { dayOfWeek: "sunday", defaultTime: "14:00", isRequired: false }, // Weekend, plus flexible
];

const DAY_NAMES = {
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
  sunday: "dimanche",
};

function calculateRealDepartureTime(departureTime: string): string {
  const [hours, minutes] = departureTime.split(":").map(Number);
  const realHours = (hours + 4) % 24;
  return `${realHours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function getDayOfWeek(date: Date): string {
  const dayIndex = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayMapping = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  return dayMapping[dayIndex as keyof typeof dayMapping];
}

async function generateTrainInstances(daysAhead: number = 14) {
  console.log(
    `🚂 Génération des trains pour les ${daysAhead} prochains jours...`
  );

  const now = new Date();
  const generated = [];
  const skipped = [];

  for (let i = 0; i <= daysAhead; i++) {
    // Construire la date à 00:00 UTC (début de journée) pour avoir une valeur canonique
    const targetDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + i,
        0,
        0,
        0,
        0
      )
    );

    // Fenêtre pour détecter les doublons : tout train ayant une date entre 00:00 et 23:59 UTC du même jour
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const dayOfWeek = getDayOfWeek(targetDate);
    const template = TRAIN_TEMPLATES.find((t) => t.dayOfWeek === dayOfWeek);

    if (!template) {
      console.log(`⚠️ Pas de template pour ${dayOfWeek}, skip`);
      continue;
    }

    // Vérifier si un train existe déjà ce jour‐là (indépendamment de l'heure)
    const existingTrain = await prisma.trainInstance.findFirst({
      where: {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    if (existingTrain) {
      skipped.push({
        date: targetDate.toLocaleDateString("fr-FR"),
        dayOfWeek: DAY_NAMES[dayOfWeek as keyof typeof DAY_NAMES],
        reason: "Existe déjà",
      });
      continue;
    }

    // Créer l'instance de train
    const realDepartureTime = calculateRealDepartureTime(template.defaultTime);
    const dayName = DAY_NAMES[dayOfWeek as keyof typeof DAY_NAMES];

    // Debug pour vérifier la cohérence
    console.log(
      `🔍 Train pour ${targetDate.toLocaleDateString(
        "fr-FR"
      )} (${dayOfWeek} -> ${dayName})`
    );

    const trainInstance = await prisma.trainInstance.create({
      data: {
        date: targetDate,
        dayOfWeek: dayName,
        departureTime: template.defaultTime,
        realDepartureTime,
        status: TrainStatus.SCHEDULED,
        isArchived: false,
      },
    });

    generated.push({
      id: trainInstance.id,
      date: targetDate.toLocaleDateString("fr-FR"),
      dayOfWeek: DAY_NAMES[dayOfWeek as keyof typeof DAY_NAMES],
      departureTime: template.defaultTime,
      realDepartureTime,
    });
  }

  console.log(`✅ ${generated.length} trains générés`);
  if (skipped.length > 0) {
    console.log(`⏭️ ${skipped.length} trains ignorés (déjà existants)`);
  }

  return { generated, skipped };
}

async function archiveOldTrains() {
  console.log("🗄️ Archivage des trains passés...");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const oldTrains = await prisma.trainInstance.updateMany({
    where: {
      date: { lt: yesterday },
      isArchived: false,
    },
    data: {
      isArchived: true,
      status: TrainStatus.COMPLETED,
    },
  });

  console.log(`📦 ${oldTrains.count} trains archivés`);
  return oldTrains.count;
}

async function updateTrainStatuses() {
  console.log("🔄 Mise à jour des statuts des trains...");

  const now = new Date();
  let updated = 0;

  // 1. Passer en BOARDING si on est entre l'heure d'inscription (departureTime)
  //    et l'heure réelle de départ (realDepartureTime)
  const trainsToCheck = await prisma.trainInstance.findMany({
    where: {
      status: { in: [TrainStatus.SCHEDULED, TrainStatus.BOARDING] },
      isArchived: false,
    },
  });

  for (const train of trainsToCheck) {
    const [hours, minutes] = train.departureTime.split(":").map(Number);
    const departureDateTime = new Date(train.date);
    departureDateTime.setUTCHours(hours, minutes, 0, 0);

    const [realHours, realMinutes] = train.realDepartureTime
      .split(":")
      .map(Number);
    const realDepartureDateTime = new Date(train.date);
    realDepartureDateTime.setUTCHours(realHours, realMinutes, 0, 0);

    // Ajustement si l'heure réelle franchit minuit (ex: 20:00 -> 00:00 le lendemain)
    if (realDepartureDateTime < departureDateTime) {
      realDepartureDateTime.setDate(realDepartureDateTime.getDate() + 1);
    }

    if (
      train.status === TrainStatus.SCHEDULED &&
      now >= departureDateTime &&
      now < realDepartureDateTime
    ) {
      await prisma.trainInstance.update({
        where: { id: train.id },
        data: { status: TrainStatus.BOARDING },
      });
      updated++;
    }

    // 2. Passer en DEPARTED si l'heure réelle est dépassée
    if (train.status !== TrainStatus.DEPARTED && now >= realDepartureDateTime) {
      await prisma.trainInstance.update({
        where: { id: train.id },
        data: { status: TrainStatus.DEPARTED },
      });
      updated++;
    }
  }

  console.log(`🔄 ${updated} statuts de trains mis à jour`);
  return updated;
}

async function cleanupExpiredPassengers() {
  console.log("🧹 Nettoyage des passagers sur trains partis...");

  // Supprimer les passagers des trains partis depuis plus de 24h
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const deletedPassengers = await prisma.trainPassenger.deleteMany({
    where: {
      trainInstance: {
        status: TrainStatus.DEPARTED,
        date: { lt: yesterday },
      },
    },
  });

  console.log(
    `🗑️ ${deletedPassengers.count} inscriptions de passagers supprimées`
  );
  return deletedPassengers.count;
}

async function main() {
  try {
    console.log("🚂 === MAINTENANCE AUTOMATIQUE DES TRAINS ===");
    console.log(`⏰ ${new Date().toLocaleString("fr-FR")}`);
    console.log("");

    // 1. Archiver les trains passés
    await archiveOldTrains();

    // 2. Mettre à jour les statuts
    await updateTrainStatuses();

    // 3. Générer les nouveaux trains (14 jours à l'avance)
    await generateTrainInstances(14);

    // 4. Nettoyer les anciens passagers
    await cleanupExpiredPassengers();

    console.log("");
    console.log("✅ Maintenance terminée avec succès !");

    // Statistiques
    const stats = await prisma.trainInstance.groupBy({
      by: ["status"],
      _count: { status: true },
      where: { isArchived: false },
    });

    console.log("");
    console.log("📊 Statistiques actuelles :");
    stats.forEach((stat) => {
      const statusLabels: Record<string, string> = {
        SCHEDULED: "Programmés",
        BOARDING: "Embarquement",
        DEPARTED: "Partis",
        CANCELLED: "Annulés",
        COMPLETED: "Terminés",
      };
      console.log(
        `   ${statusLabels[stat.status] || stat.status}: ${stat._count.status}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de la maintenance:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer si exécuté directement
if (require.main === module) {
  main();
}

export { archiveOldTrains, generateTrainInstances, updateTrainStatuses };
