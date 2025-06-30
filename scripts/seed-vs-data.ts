// @ts-nocheck

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Noms d'alliances ennemies réalistes
const enemyAlliances = [
  "Les Derniers Guerriers",
  "Empire du Nord",
  "Légion Sombre",
  "Phoenix Rising",
  "Gardiens Éternels",
  "Dragons Noirs",
  "Loups de Guerre",
  "Titans Écarlates",
];

// Pseudos de membres réalistes pour les tests
const memberPseudos = [
  "CommanderX",
  "WarMachine",
  "ShadowHunter",
  "IronFist",
  "BloodRaven",
  "StormBreaker",
  "DeathKnight",
  "FireBlade",
  "IceWolf",
  "ThunderStrike",
  "VoidWalker",
  "CrimsonLord",
  "SteelClaw",
  "DarkPhoenix",
  "BattleMaster",
  "SwiftArrow",
  "GrimReaper",
  "FlameWarden",
  "FrostBite",
  "LightBringer",
  "Shadowbane",
  "StarCrusher",
  "MoonSlayer",
  "SunWarrior",
  "NightHawk",
];

// Événements possibles pour les jours de VS
const vsEvents = [
  "Double Kill Bonus",
  "Power Hour",
  "Alliance Rally",
  "Defense Boost",
  "Attack Frenzy",
  "MVP Challenge",
  "Last Stand",
  "Revenge Mode",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateParticipantStats() {
  const killsPerDay = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 15)
  );
  const deathsPerDay = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 8)
  );
  const participationDays = killsPerDay.map(
    (kills, index) => kills > 0 || Math.random() > 0.3 // Participate if has kills or 70% chance
  );

  return {
    dailyKills: killsPerDay,
    dailyDeaths: deathsPerDay,
    dailyParticipation: participationDays,
    totalKills: killsPerDay.reduce((sum, k) => sum + k, 0),
    totalDeaths: deathsPerDay.reduce((sum, d) => sum + d, 0),
    participation: Math.round(
      (participationDays.filter((p) => p).length / 6) * 100
    ),
  };
}

async function createVSWeek(
  weekNumber: number,
  year: number,
  weekOffset: number
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + weekOffset * 7);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5); // 6 jours au total (0-5)

  const enemyName = getRandomElement(enemyAlliances);

  // Scores aléatoires mais réalistes
  const allianceScore = generateRandomScore(120, 300);
  const enemyScore = generateRandomScore(100, 280);

  let result: "VICTORY" | "DEFEAT" | "DRAW" | null = null;
  let status: "PREPARATION" | "ACTIVE" | "COMPLETED" | "CANCELLED" =
    "COMPLETED";

  if (weekOffset < 0) {
    // Semaines passées
    if (allianceScore > enemyScore) result = "VICTORY";
    else if (allianceScore < enemyScore) result = "DEFEAT";
    else result = "DRAW";
    status = "COMPLETED";
  } else if (weekOffset === 0) {
    // Semaine actuelle
    status = "ACTIVE";
    if (allianceScore > enemyScore) result = "VICTORY";
    else if (allianceScore < enemyScore) result = "DEFEAT";
    else result = "DRAW";
  } else {
    // Semaines futures
    status = "PREPARATION";
  }

  console.log(`Création VS - Semaine ${weekNumber}/${year} vs ${enemyName}`);

  const vsWeek = await prisma.vSWeek.create({
    data: {
      weekNumber,
      year,
      startDate,
      endDate,
      title: `VS contre ${enemyName}`,
      allianceScore: weekOffset <= 0 ? allianceScore : 0,
      enemyScore: weekOffset <= 0 ? enemyScore : 0,
      enemyName,
      status,
      isCompleted: status === "COMPLETED",
      result: status === "COMPLETED" ? result : null,
    },
  });

  // Créer les 6 jours de VS
  const vsDays = [];
  for (let dayNumber = 1; dayNumber <= 6; dayNumber++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + (dayNumber - 1));

    let dayAllianceScore = 0;
    let dayEnemyScore = 0;

    if (weekOffset <= 0) {
      // Scores distribués sur les jours pour les semaines passées/actuelles
      dayAllianceScore =
        Math.floor(allianceScore / 6) + (Math.random() * 10 - 5);
      dayEnemyScore = Math.floor(enemyScore / 6) + (Math.random() * 10 - 5);

      // Ajustements pour que le total soit cohérent
      if (dayNumber === 6) {
        const totalDaysAlliance = vsDays.reduce(
          (sum, day) => sum + day.allianceScore,
          0
        );
        const totalDaysEnemy = vsDays.reduce(
          (sum, day) => sum + day.enemyScore,
          0
        );
        dayAllianceScore = allianceScore - totalDaysAlliance;
        dayEnemyScore = enemyScore - totalDaysEnemy;
      }
    }

    const events: string[] = [];
    if (Math.random() > 0.7) {
      events.push(getRandomElement(vsEvents));
    }

    const vsDay = await prisma.vSDay.create({
      data: {
        weekId: vsWeek.id,
        dayNumber,
        date: dayDate,
        allianceScore: Math.max(0, dayAllianceScore),
        enemyScore: Math.max(0, dayEnemyScore),
        events,
      },
    });

    vsDays.push(vsDay);
  }

  // Créer 15-25 participants aléatoires
  const participantCount = generateRandomScore(15, 25);
  const participants = [];

  for (let i = 0; i < participantCount; i++) {
    const memberPseudo = getRandomElement(memberPseudos);
    const stats = generateParticipantStats();

    const powerGain = BigInt(
      stats.totalKills * 1000000 + generateRandomScore(0, 5000000)
    );
    const powerLoss = BigInt(
      stats.totalDeaths * 500000 + generateRandomScore(0, 2000000)
    );

    // Récompenses basées sur les performances
    const rewards: string[] = [];
    if (stats.totalKills >= 40) rewards.push("Top Killer");
    if (stats.totalKills >= 60) rewards.push("Elite Warrior");
    if (stats.participation >= 80) rewards.push("Excellent Participation");
    if (stats.totalKills > 0 && stats.totalDeaths === 0)
      rewards.push("Invincible");
    if (
      stats.totalKills >= 25 &&
      stats.totalKills / Math.max(stats.totalDeaths, 1) >= 3
    ) {
      rewards.push("Kill Master");
    }

    // Points VS aléatoires pour le classement
    const points = generateRandomScore(50, 300);

    const participant = await prisma.vSParticipant.create({
      data: {
        weekId: vsWeek.id,
        memberId: `member_${memberPseudo}_${i}`,
        kills: stats.totalKills,
        deaths: stats.totalDeaths,
        powerGain,
        powerLoss,
        participation: stats.participation,
        rank: i + 1, // Sera recalculé après
        rewards,
        points, // Ajout des points VS
      },
    });

    participants.push({ participant, stats });

    // Créer les résultats quotidiens pour ce participant
    for (let dayNumber = 1; dayNumber <= 6; dayNumber++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + (dayNumber - 1));

      const dayKills = stats.dailyKills[dayNumber - 1];
      const dayDeaths = stats.dailyDeaths[dayNumber - 1];
      const participated = stats.dailyParticipation[dayNumber - 1];

      const attacks = participated ? dayKills + generateRandomScore(0, 5) : 0;
      const defenses = participated ? dayDeaths + generateRandomScore(0, 3) : 0;
      const mvpPoints = dayKills >= 8 ? generateRandomScore(5, 15) : 0;

      const events: string[] = [];
      if (mvpPoints > 10) events.push("Daily MVP");
      if (dayKills >= 10) events.push("Kill Streak");
      if (dayKills > 0 && dayDeaths === 0) events.push("Perfect Day");

      await prisma.vSParticipantDay.create({
        data: {
          participantId: participant.id,
          weekId: vsWeek.id,
          dayNumber,
          date: dayDate,
          kills: dayKills,
          deaths: dayDeaths,
          powerGain: BigInt(
            dayKills * 1000000 + generateRandomScore(0, 1000000)
          ),
          powerLoss: BigInt(
            dayDeaths * 500000 + generateRandomScore(0, 500000)
          ),
          attacks,
          defenses,
          participated,
          mvpPoints,
          events,
          notes: mvpPoints > 12 ? "Excellent performance today!" : undefined,
        },
      });
    }
  }

  // Recalculer les classements basés sur les points
  participants.sort((a, b) => {
    if (b.participant.points !== a.participant.points) {
      return b.participant.points - a.participant.points;
    }
    return b.stats.participation - a.stats.participation;
  });

  for (let i = 0; i < participants.length; i++) {
    await prisma.vSParticipant.update({
      where: { id: participants[i].participant.id },
      data: { rank: i + 1 },
    });
  }

  console.log(
    `✅ VS créé avec ${participantCount} participants et 6 jours de résultats`
  );
  return vsWeek;
}

async function main() {
  console.log("🚀 Début du seed des données VS (6 jours)...");

  try {
    // Nettoyer les données existantes
    console.log("🧹 Nettoyage des données VS existantes...");
    await prisma.vSParticipantDay.deleteMany();
    await prisma.vSParticipant.deleteMany();
    await prisma.vSDay.deleteMany();
    await prisma.vSWeek.deleteMany();

    const currentYear = new Date().getFullYear();
    const currentWeek = Math.ceil(
      new Date().getTime() / (1000 * 60 * 60 * 24 * 7)
    );

    // Créer 5 semaines VS : 3 passées, 1 actuelle, 1 future
    const vsWeeks = [];

    // Semaines passées (-3, -2, -1)
    for (let i = 3; i >= 1; i--) {
      const weekNumber = Math.max(1, currentWeek - i);
      const vsWeek = await createVSWeek(weekNumber, currentYear, -i);
      vsWeeks.push(vsWeek);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Petit délai pour éviter les conflits
    }

    // Semaine actuelle (0)
    const currentVSWeek = await createVSWeek(currentWeek, currentYear, 0);
    vsWeeks.push(currentVSWeek);

    // Semaine future (+1)
    const futureVSWeek = await createVSWeek(currentWeek + 1, currentYear, 1);
    vsWeeks.push(futureVSWeek);

    console.log("\n📊 Résumé des VS créés:");
    for (const week of vsWeeks) {
      const participantCount = await prisma.vSParticipant.count({
        where: { weekId: week.id },
      });

      console.log(
        `  - Semaine ${week.weekNumber}/${week.year}: ${week.status} - ${participantCount} participants`
      );
      console.log(
        `    Score: ${week.allianceScore}-${week.enemyScore} vs ${week.enemyName}`
      );
      if (week.result) {
        console.log(`    Résultat: ${week.result}`);
      }
    }

    console.log("\n✅ Seed des données VS terminé avec succès!");
    console.log("📝 Données générées:");
    console.log(`  - ${vsWeeks.length} semaines VS`);
    console.log(`  - ${vsWeeks.length * 6} jours de VS (6 jours par semaine)`);

    const totalParticipants = await prisma.vSParticipant.count();
    const totalDailyResults = await prisma.vSParticipantDay.count();

    console.log(`  - ${totalParticipants} participants`);
    console.log(`  - ${totalDailyResults} résultats quotidiens`);
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
