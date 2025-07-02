import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDesertStorm() {
  console.log("🧹 Cleaning existing Desert Storm data...");
  await prisma.desertStormDaily.deleteMany();
  await prisma.desertStormParticipant.deleteMany();
  await prisma.desertStormEvent.deleteMany();
  console.log("✅ Previous data removed");

  console.log("🌱 Seeding Desert Storm events...");

  // Récupérer tous les membres pour avoir des IDs valides
  let members = await prisma.member.findMany({
    take: 60,
  });

  if (members.length < 60) {
    const missing = 60 - members.length;
    console.log(`👉 Creating ${missing} dummy members to reach 60…`);
    for (let i = 0; i < missing; i++) {
      await prisma.member.create({
        data: {
          pseudo: `SeedMember_${Date.now()}_${i}`,
        } as any,
      });
    }
    members = await prisma.member.findMany({ take: 60 });
  }

  // Créer 3 événements Desert Storm
  const events = await Promise.all([
    // Événement en cours
    prisma.desertStormEvent.create({
      data: {
        title: "Desert Storm - Bataille Épique",
        description:
          "Grande bataille entre les équipes Alpha et Bravo pour la domination du serveur",
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
        teamAName: "Équipe Alpha",
        teamBName: "Équipe Bravo",
        teamAScore: 150,
        teamBScore: 142,
        enemyTeamAAllianceName: "Shadow Legion A",
        enemyTeamBAllianceName: "Shadow Legion B",
        enemyTeamAScore: 148,
        enemyTeamBScore: 150,
        status: "ACTIVE",
      } as any,
    }),

    // Événement terminé
    prisma.desertStormEvent.create({
      data: {
        title: "Desert Storm - Guerre des Titans",
        description: "Confrontation légendaire entre les meilleurs combattants",
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        teamAName: "Titans du Nord",
        teamBName: "Guerriers du Sud",
        teamAScore: 89,
        teamBScore: 94,
        enemyTeamAAllianceName: "Dragon A",
        enemyTeamBAllianceName: "Dragon B",
        enemyTeamAScore: 90,
        enemyTeamBScore: 85,
        status: "COMPLETED",
        result: "TEAM_B_VICTORY",
      } as any,
    }),

    // Événement futur
    prisma.desertStormEvent.create({
      data: {
        title: "Desert Storm - Nouvelle Ère",
        description:
          "Le prochain grand événement qui marquera une nouvelle ère",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
        endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Dans 12 jours
        teamAName: "Légion Écarlate",
        teamBName: "Garde Impériale",
        teamAScore: 0,
        teamBScore: 0,
        enemyTeamAAllianceName: "Phoenix A",
        enemyTeamBAllianceName: "Phoenix B",
        enemyTeamAScore: 0,
        enemyTeamBScore: 0,
        status: "PREPARATION",
      } as any,
    }),
  ]);

  console.log(`✅ Created ${events.length} Desert Storm events`);

  // Ajouter des participants à l'événement actif
  const activeEvent = events[0];
  const completedEvent = events[1];

  // Diviser les membres en 2 équipes de 30 (20 + 10)
  const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
  const teamAMembers = shuffledMembers.slice(0, 30); // 0-29
  const teamBMembers = shuffledMembers.slice(30, 60); // 30-59

  const teamASubs = teamAMembers.slice(-10); // Derniers 10 → remplaçants
  const teamBSubs = teamBMembers.slice(-10);

  // Participants pour l'événement actif
  const activeParticipants = await Promise.all([
    ...teamAMembers.map((member, index) =>
      prisma.desertStormParticipant.create({
        data: {
          eventId: activeEvent.id,
          memberId: member.id,
          team: "TEAM_A",
          isSubstitute: teamASubs.includes(member),
          totalKills: Math.floor(Math.random() * 50) + 10,
          totalDeaths: Math.floor(Math.random() * 30) + 5,
          totalDamage: BigInt(Math.floor(Math.random() * 5000000) + 1000000),
          powerGain: BigInt(Math.floor(Math.random() * 100000) + 10000),
          powerLoss: BigInt(Math.floor(Math.random() * 50000) + 5000),
          participation: Math.floor(Math.random() * 40) + 60, // 60-100%
          points: Math.floor(Math.random() * 200) + 50,
          rank: index < 3 ? index + 1 : undefined,
          rewards:
            index === 0
              ? ["Top Killer", "MVP"]
              : index === 1
              ? ["Excellent Participation"]
              : [],
        } as any,
      })
    ),
    ...teamBMembers.map((member, index) =>
      prisma.desertStormParticipant.create({
        data: {
          eventId: activeEvent.id,
          memberId: member.id,
          team: "TEAM_B",
          isSubstitute: teamBSubs.includes(member),
          totalKills: Math.floor(Math.random() * 50) + 10,
          totalDeaths: Math.floor(Math.random() * 30) + 5,
          totalDamage: BigInt(Math.floor(Math.random() * 5000000) + 1000000),
          powerGain: BigInt(Math.floor(Math.random() * 100000) + 10000),
          powerLoss: BigInt(Math.floor(Math.random() * 50000) + 5000),
          participation: Math.floor(Math.random() * 40) + 60, // 60-100%
          points: Math.floor(Math.random() * 200) + 50,
          rank: index < 3 ? index + 4 : undefined, // Classement général 4-6 pour team B
          rewards: index === 0 ? ["Team Leader"] : [],
        } as any,
      })
    ),
  ]);

  // Participants pour l'événement terminé (30 par team)
  const completedParticipants = await Promise.all([
    ...teamAMembers.map((member, index) =>
      prisma.desertStormParticipant.create({
        data: {
          eventId: completedEvent.id,
          memberId: member.id,
          team: "TEAM_A",
          isSubstitute: teamASubs.includes(member),
          totalKills: Math.floor(Math.random() * 40) + 5,
          totalDeaths: Math.floor(Math.random() * 25) + 3,
          totalDamage: BigInt(Math.floor(Math.random() * 3000000) + 500000),
          powerGain: BigInt(Math.floor(Math.random() * 80000) + 5000),
          powerLoss: BigInt(Math.floor(Math.random() * 40000) + 2000),
          participation: Math.floor(Math.random() * 30) + 70, // 70-100%
          points: Math.floor(Math.random() * 150) + 30,
          rewards: index < 3 ? ["Veteran Fighter"] : [],
        } as any,
      })
    ),
    ...teamBMembers.map((member, index) =>
      prisma.desertStormParticipant.create({
        data: {
          eventId: completedEvent.id,
          memberId: member.id,
          team: "TEAM_B",
          isSubstitute: teamBSubs.includes(member),
          totalKills: Math.floor(Math.random() * 45) + 8,
          totalDeaths: Math.floor(Math.random() * 20) + 2,
          totalDamage: BigInt(Math.floor(Math.random() * 4000000) + 800000),
          powerGain: BigInt(Math.floor(Math.random() * 90000) + 8000),
          powerLoss: BigInt(Math.floor(Math.random() * 30000) + 1000),
          participation: Math.floor(Math.random() * 25) + 75, // 75-100%
          points: Math.floor(Math.random() * 180) + 40,
          rewards: index < 3 ? ["Champion"] : [],
        } as any,
      })
    ),
  ]);

  // Créer quelques résultats quotidiens pour l'événement actif
  const dailyResults = await Promise.all([
    // Jour 1
    ...activeParticipants.slice(0, 10).map((participant) =>
      prisma.desertStormDaily.create({
        data: {
          eventId: activeEvent.id,
          participantId: participant.id,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
          teamA: Math.floor(Math.random() * 30) + 10,
          teamB: Math.floor(Math.random() * 30) + 10,
          kills: Math.floor(Math.random() * 15) + 2,
          deaths: Math.floor(Math.random() * 8) + 1,
          damage: BigInt(Math.floor(Math.random() * 1000000) + 200000),
          participated: true,
          events: ["Bataille principale", "Escarmouche"],
          notes: Math.random() > 0.7 ? "Performance exceptionnelle" : undefined,
        },
      })
    ),

    // Jour 2
    ...activeParticipants.slice(5, 15).map((participant) =>
      prisma.desertStormDaily.create({
        data: {
          eventId: activeEvent.id,
          participantId: participant.id,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hier
          teamA: Math.floor(Math.random() * 25) + 15,
          teamB: Math.floor(Math.random() * 25) + 15,
          kills: Math.floor(Math.random() * 12) + 3,
          deaths: Math.floor(Math.random() * 6) + 1,
          damage: BigInt(Math.floor(Math.random() * 1200000) + 300000),
          participated: Math.random() > 0.2, // 80% de participation
          events: ["Raid coordonné", "Défense de base"],
        },
      })
    ),
  ]);

  console.log(
    `✅ Created ${
      activeParticipants.length + completedParticipants.length
    } participants`
  );
  console.log(`✅ Created ${dailyResults.length} daily results`);

  console.log("✅ Desert Storm seeding completed!");
}

// Exécuter le seeding
seedDesertStorm()
  .catch((e) => {
    console.error("❌ Error seeding Desert Storm:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
