import { PrismaClient, VSWeekStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seedVSTestData() {
  console.log("🎯 Création des données de test VS...");

  try {
    // 1. Créer des membres de test s'ils n'existent pas
    console.log("👥 Création des membres de test...");

    const testMembers = [
      {
        pseudo: "DragonSlayer",
        level: 85,
        power: "120000000",
        kills: 1250,
        specialty: "Attaque",
        allianceRole: "R5" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "ShadowNinja",
        level: 82,
        power: "98000000",
        kills: 890,
        specialty: "Défense",
        allianceRole: "R4" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "FireStorm",
        level: 78,
        power: "75000000",
        kills: 650,
        specialty: "Stratégie",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "IceQueen",
        level: 80,
        power: "85000000",
        kills: 720,
        specialty: "Support",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "ThunderBolt",
        level: 76,
        power: "68000000",
        kills: 480,
        specialty: "Reconnaissance",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "VoidWalker",
        level: 84,
        power: "110000000",
        kills: 980,
        specialty: "Élite",
        allianceRole: "R4" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "Starlight",
        level: 73,
        power: "55000000",
        kills: 320,
        specialty: "Nouvelles recrues",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "BloodRaven",
        level: 79,
        power: "78000000",
        kills: 590,
        specialty: "Attaque",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "GoldenEagle",
        level: 81,
        power: "92000000",
        kills: 780,
        specialty: "Défense",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
      {
        pseudo: "MysticMage",
        level: 77,
        power: "70000000",
        kills: 410,
        specialty: "Stratégie",
        allianceRole: "MEMBER" as const,
        status: "ACTIVE" as const,
      },
    ];

    const createdMembers = [];
    for (const memberData of testMembers) {
      const existing = await prisma.member.findFirst({
        where: { pseudo: memberData.pseudo },
      });

      if (!existing) {
        const member = await prisma.member.create({
          data: {
            ...memberData,
            power: BigInt(memberData.power),
            tags: [memberData.specialty],
            lastActive: new Date(),
            notes: `Membre de test créé pour les VS - ${memberData.specialty}`,
          },
        });
        createdMembers.push(member);
        console.log(`  ✅ Membre créé: ${member.pseudo}`);
      } else {
        createdMembers.push(existing);
        console.log(`  ⚠️  Membre existant: ${existing.pseudo}`);
      }
    }

    // 2. Créer une semaine VS de test
    console.log("⚔️ Création d'une semaine VS de test...");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 3); // Commencé il y a 3 jours
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // 7 jours au total

    const weekNumber = getWeekNumber(startDate);
    const year = startDate.getFullYear();

    let vsWeek = await prisma.vSWeek.findFirst({
      where: {
        year,
        weekNumber,
        status: VSWeekStatus.ACTIVE,
      },
    });

    if (!vsWeek) {
      vsWeek = await prisma.vSWeek.create({
        data: {
          weekNumber,
          year,
          startDate,
          endDate,
          title: `VS Test - Semaine ${weekNumber}`,
          enemyName: "Alliance Ennemie Test",
          status: VSWeekStatus.ACTIVE,
          allianceScore: 0,
          enemyScore: 0,
        },
      });
      console.log(`  ✅ VS créé: ${vsWeek.title}`);
    } else {
      console.log(`  ⚠️  VS existant: ${vsWeek.title}`);
    }

    // 3. Créer les 7 jours si ils n'existent pas
    console.log("📅 Création des jours VS...");

    for (let day = 1; day <= 7; day++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + day - 1);

      const existingDay = await prisma.vSDay.findFirst({
        where: {
          weekId: vsWeek.id,
          dayNumber: day,
        },
      });

      if (!existingDay) {
        await prisma.vSDay.create({
          data: {
            weekId: vsWeek.id,
            dayNumber: day,
            date: dayDate,
            allianceScore: Math.floor(Math.random() * 50000) + 10000,
            enemyScore: Math.floor(Math.random() * 45000) + 15000,
          },
        });
        console.log(`  ✅ Jour ${day} créé`);
      }
    }

    // 4. Créer des participants et leurs données quotidiennes
    console.log("🏆 Création des participants et points VS...");

    for (const member of createdMembers) {
      // Vérifier/créer le participant
      let participant = await prisma.vSParticipant.findUnique({
        where: {
          weekId_memberId: {
            weekId: vsWeek.id,
            memberId: member.id,
          },
        },
      });

      if (!participant) {
        participant = await prisma.vSParticipant.create({
          data: {
            weekId: vsWeek.id,
            memberId: member.id,
            kills: 0,
            deaths: 0,
            powerGain: 0n,
            powerLoss: 0n,
            participation: 0,
            points: 0,
          },
        });
      }

      // Créer des données quotidiennes avec des points aléatoires
      for (let day = 1; day <= 7; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + day - 1);

        const existing = await prisma.vSParticipantDay.findUnique({
          where: {
            participantId_dayNumber: {
              participantId: participant.id,
              dayNumber: day,
            },
          },
        });

        if (!existing) {
          // Générer des points aléatoires selon le niveau du membre
          const basePoints = member.level * 100;
          const randomPoints =
            Math.floor(Math.random() * basePoints) +
            Math.floor(basePoints * 0.5);

          const kills = Math.floor(Math.random() * 15) + 1;
          const deaths = Math.floor(Math.random() * 8);
          const powerGain = BigInt(
            Math.floor(Math.random() * 5000000) + 1000000
          );

          await prisma.vSParticipantDay.create({
            data: {
              participantId: participant.id,
              weekId: vsWeek.id,
              dayNumber: day,
              date: dayDate,
              kills,
              deaths,
              powerGain,
              powerLoss: BigInt(Math.floor(Math.random() * 2000000)),
              attacks: Math.floor(Math.random() * 20) + 5,
              defenses: Math.floor(Math.random() * 15) + 2,
              participated: true,
              mvpPoints: randomPoints,
              events:
                day === 1
                  ? ["Première bataille"]
                  : day === 7
                  ? ["Bataille finale"]
                  : [],
              notes: `Performance du jour ${day}`,
            },
          });
        }
      }

      console.log(`  ✅ Participant créé: ${member.pseudo}`);
    }

    // 5. Mettre à jour les totaux du VS
    console.log("📊 Calcul des totaux...");

    const allDays = await prisma.vSDay.findMany({
      where: { weekId: vsWeek.id },
    });

    const totalAllianceScore = allDays.reduce(
      (sum, day) => sum + day.allianceScore,
      0
    );
    const totalEnemyScore = allDays.reduce(
      (sum, day) => sum + day.enemyScore,
      0
    );

    let result: "VICTORY" | "DEFEAT" | "DRAW" | null = null;
    if (totalAllianceScore > totalEnemyScore) result = "VICTORY";
    else if (totalAllianceScore < totalEnemyScore) result = "DEFEAT";
    else result = "DRAW";

    await prisma.vSWeek.update({
      where: { id: vsWeek.id },
      data: {
        allianceScore: totalAllianceScore,
        enemyScore: totalEnemyScore,
        result,
      },
    });

    console.log("✨ Données de test VS créées avec succès !");
    console.log(`📈 VS: ${vsWeek.title}`);
    console.log(`🏆 Score Alliance: ${totalAllianceScore}`);
    console.log(`⚔️ Score Ennemi: ${totalEnemyScore}`);
    console.log(`🎯 Résultat: ${result}`);
    console.log(`👥 Participants: ${createdMembers.length}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création des données de test:", error);
    throw error;
  }
}

// Fonction utilitaire pour calculer le numéro de semaine
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Exécuter le script
seedVSTestData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
