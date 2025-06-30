import { VSWeekStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Création de données VS de test...");

  // Récupérer quelques membres pour les utiliser
  const members = await prisma.member.findMany({
    take: 5,
  });

  if (members.length === 0) {
    throw new Error("Aucun membre trouvé. Exécutez d'abord le seed principal.");
  }

  // Calculer les dates de début et fin
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  const daysUntilMonday =
    currentDay === 0 ? 1 : currentDay === 1 ? 0 : 8 - currentDay;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  startDate.setHours(0, 0, 0, 0); // Début de la journée

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5); // +5 jours (lundi à samedi)
  endDate.setHours(23, 59, 59, 999); // Fin de la journée

  // Calculer le numéro de semaine
  const startOfYear = new Date(startDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((startDate.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7
  );

  // Créer une semaine VS
  const vsWeek = await prisma.vSWeek.create({
    data: {
      startDate,
      endDate,
      enemyName: "Alliance Test",
      title: `VS Semaine ${weekNumber}`,
      status: VSWeekStatus.ACTIVE,
      allianceScore: 1000000,
      enemyScore: 900000,
      weekNumber,
      year: startDate.getFullYear(),
    },
  });

  console.log("✅ Semaine VS créée:", vsWeek.id);

  // Créer les jours
  const days = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const day = await prisma.vSDay.create({
      data: {
        weekId: vsWeek.id,
        dayNumber: i + 1,
        date,
        allianceScore: Math.floor(Math.random() * 200000),
        enemyScore: Math.floor(Math.random() * 180000),
      },
    });
    days.push(day);
    console.log(`✅ Jour ${i + 1} créé`);
  }

  // Créer les participants
  for (const member of members) {
    const participant = await prisma.vSParticipant.create({
      data: {
        weekId: vsWeek.id,
        memberId: member.id,
        totalMvp: 0,
        totalKills: 0,
      },
    });

    // Créer les résultats quotidiens
    for (const day of days) {
      await prisma.vSParticipantDay.create({
        data: {
          participantId: participant.id,
          weekId: vsWeek.id,
          dayNumber: day.dayNumber,
          date: day.date,
          mvpPoints: Math.floor(Math.random() * 20),
          kills: Math.floor(Math.random() * 10),
          deaths: Math.floor(Math.random() * 5),
          powerGain: BigInt(Math.floor(Math.random() * 1000000)),
          participated: true,
        },
      });
    }

    console.log(
      `✅ Participant ${member.pseudo} créé avec ses résultats quotidiens`
    );
  }

  console.log("✅ Données VS de test créées avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
