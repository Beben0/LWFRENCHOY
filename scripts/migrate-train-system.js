// Script de migration pour le nouveau système de trains
// Exécuter avec: node scripts/migrate-train-system.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateTrainSystem() {
  try {
    console.log("🚀 Début de la migration du système de trains...");

    // 1. Récupérer les anciens trains
    console.log("📋 Récupération des données existantes...");

    const existingTrains = await prisma.trainSlot
      .findMany({
        include: {
          member: true,
        },
      })
      .catch(() => {
        console.log("ℹ️  Aucune donnée existante trouvée (nouveau système)");
        return [];
      });

    console.log(`📊 ${existingTrains.length} trains existants trouvés`);

    // 2. Si nous avons des données avec l'ancien schéma, les migrer
    if (existingTrains.length > 0 && existingTrains[0].member) {
      console.log("🔄 Migration des données vers le nouveau format...");

      for (const train of existingTrains) {
        if (train.member) {
          await prisma.trainSlot
            .update({
              where: { id: train.id },
              data: {
                conductorId: train.member.id,
                departureTime: train.timeSlot || "20:00",
              },
            })
            .catch((err) => {
              console.log(
                `⚠️  Erreur lors de la migration du train ${train.id}:`,
                err.message
              );
            });
        }
      }
    }

    // 3. Créer des trains par défaut pour chaque jour si aucun n'existe
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (const day of days) {
      const existingDayTrain = await prisma.trainSlot.findUnique({
        where: { day },
      });

      if (!existingDayTrain) {
        console.log(`➕ Création d'un slot par défaut pour ${day}...`);
        await prisma.trainSlot
          .create({
            data: {
              day,
              departureTime: "20:00", // Heure par défaut
              conductorId: null,
            },
          })
          .catch((err) => {
            console.log(
              `⚠️  Erreur lors de la création du slot pour ${day}:`,
              err.message
            );
          });
      }
    }

    console.log("✅ Migration terminée avec succès !");
    console.log("");
    console.log("📖 Nouveau système de trains :");
    console.log("   • Un conducteur par jour maximum");
    console.log("   • Créneau spécifié → Train part 4h après");
    console.log("   • Période d'inscription de 4h pour les passagers");
    console.log("");
    console.log("🌐 Accédez à /trains pour voir le nouveau système");
    console.log("📚 Guide complet disponible sur /trains-info");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    console.error("");
    console.error("🔧 Solutions possibles :");
    console.error(
      "   1. Vérifiez que la DATABASE_URL est configurée dans .env"
    );
    console.error("   2. Exécutez: npx prisma generate");
    console.error("   3. Exécutez: npx prisma db push");
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateTrainSystem();
}

module.exports = { migrateTrainSystem };
