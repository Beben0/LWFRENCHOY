import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer les entrées de points pour un VS
export async function GET(request: NextRequest, context: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "view_vs")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const vsWeekId = context.params.id;

    const entries = await prisma.vSParticipantDay.findMany({
      where: {
        weekId: vsWeekId,
      },
      include: {
        participant: {
          include: {
            member: {
              select: {
                id: true,
                pseudo: true,
              },
            },
          },
        },
      },
      orderBy: [
        { dayNumber: "asc" },
        { participant: { member: { pseudo: "asc" } } },
      ],
    });

    // Convertir les BigInt (et Date) en chaînes pour éviter les erreurs de sérialisation
    // et donc éviter que Next.js renvoie une page d'erreur HTML
    const safeEntries = entries.map((e) => jsonify(e));

    return NextResponse.json(safeEntries);
  } catch (error) {
    console.error("Erreur lors de la récupération des entrées VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder les entrées de points VS
export async function POST(request: NextRequest, context: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "edit_vs")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const vsWeekId = context.params.id;
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Format des données invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le VS existe
    const vsWeek = await prisma.vSWeek.findUnique({
      where: { id: vsWeekId },
    });

    if (!vsWeek) {
      return NextResponse.json({ error: "VS introuvable" }, { status: 404 });
    }

    // Traitement par transaction pour cohérence
    await prisma.$transaction(async (tx) => {
      // Pour chaque entrée, créer ou mettre à jour le participant et ses données quotidiennes
      for (const entry of entries) {
        // Vérifier/créer le participant pour cette semaine
        let participant = await tx.vSParticipant.findUnique({
          where: {
            weekId_memberId: {
              weekId: vsWeekId,
              memberId: entry.memberId,
            },
          },
        });

        if (!participant) {
          participant = await tx.vSParticipant.create({
            data: {
              weekId: vsWeekId,
              memberId: entry.memberId,
            },
          });
        }

        // Déterminer la date fiable du jour
        let dayDate: Date;
        const parsed = new Date(entry.date);
        if (isNaN(parsed.getTime())) {
          // Fallback: calculer à partir de la date de début de la semaine
          const weekStart = new Date(vsWeek.startDate);
          dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + (entry.day - 1));
        } else {
          dayDate = parsed;
        }

        // Créer ou mettre à jour l'entrée quotidienne
        await tx.vSParticipantDay.upsert({
          where: {
            participantId_dayNumber: {
              participantId: participant.id,
              dayNumber: entry.day,
            },
          },
          create: {
            participantId: participant.id,
            weekId: vsWeekId,
            dayNumber: entry.day,
            date: dayDate,
            mvpPoints: entry.points,
            participated: entry.points > 0,
          },
          update: {
            mvpPoints: entry.points,
            participated: entry.points > 0,
            date: dayDate,
          },
        });

        // Recalculer les points totaux du participant
        const participantDays = await tx.vSParticipantDay.findMany({
          where: { participantId: participant.id },
        });

        const totalPoints = participantDays.reduce(
          (sum, day) => sum + (day.mvpPoints || 0),
          0
        );
        const totalKills = participantDays.reduce(
          (sum, day) => sum + (day.kills || 0),
          0
        );
        const totalDeaths = participantDays.reduce(
          (sum, day) => sum + (day.deaths || 0),
          0
        );
        const participatedDays = participantDays.filter(
          (day) => day.participated
        ).length;
        const participation = Math.round((participatedDays / 6) * 100); // 6 jours par semaine

        await tx.vSParticipant.update({
          where: { id: participant.id },
          data: {
            points: totalPoints,
            kills: totalKills,
            deaths: totalDeaths,
            participation: participation,
          },
        });
      }

      // Recalculer les scores de l'alliance et de l'ennemi
      const days = await tx.vSDay.findMany({
        where: { weekId: vsWeekId },
      });

      const totalAllianceScore = days.reduce(
        (sum, day) => sum + day.allianceScore,
        0
      );
      const totalEnemyScore = days.reduce(
        (sum, day) => sum + day.enemyScore,
        0
      );

      let result: "VICTORY" | "DEFEAT" | "DRAW" | null = null;
      if (totalAllianceScore > totalEnemyScore) result = "VICTORY";
      else if (totalAllianceScore < totalEnemyScore) result = "DEFEAT";
      else if (totalAllianceScore === totalEnemyScore) result = "DRAW";

      await tx.vSWeek.update({
        where: { id: vsWeekId },
        data: {
          allianceScore: totalAllianceScore,
          enemyScore: totalEnemyScore,
          result: result,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Points sauvegardés avec succès",
      entriesCount: entries.length,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des entrées VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
