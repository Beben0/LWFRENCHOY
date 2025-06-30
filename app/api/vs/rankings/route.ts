// @ts-nocheck
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Récupérer les classements VS
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "current"; // current, historical, global
    const year = searchParams.get("year");
    const weekNumber = searchParams.get("week");
    const limit = parseInt(searchParams.get("limit") || "20");
    const weekId = searchParams.get("weekId");

    let ranking: any[] = [];
    let metadata: any = {};

    switch (type) {
      case "current": {
        // Classement de la semaine actuelle ou plus récente
        let targetWeek;

        if (weekId) {
          targetWeek = await prisma.vSWeek.findUnique({
            where: { id: weekId },
          });
        } else {
          targetWeek = await prisma.vSWeek.findFirst({
            where: {
              OR: [{ status: "ACTIVE" }, { status: "COMPLETED" }],
            },
            orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
          });
        }

        if (targetWeek) {
          const participants = await prisma.vSParticipant.findMany({
            where: { weekId: targetWeek.id },
            orderBy: [{ points: "desc" }, { participation: "desc" }],
            take: limit,
            include: {
              member: {
                select: { pseudo: true },
              },
            },
          });

          // Convertir BigInt en string
          ranking = participants.map((p: any) => ({
            ...p,
            memberPseudo: p.memberPseudo || p.member?.pseudo || "?",
            powerGain: p.powerGain.toString(),
            powerLoss: p.powerLoss.toString(),
          }));

          metadata = {
            weekNumber: targetWeek.weekNumber,
            year: targetWeek.year,
            enemyName: targetWeek.enemyName,
            status: targetWeek.status,
          };
        }
        break;
      }

      case "historical": {
        // Top performers sur toutes les semaines complétées
        const participants = await prisma.vSParticipant.findMany({
          where: {
            week: {
              isCompleted: true,
            },
          },
          orderBy: [{ points: "desc" }, { participation: "desc" }],
          take: limit,
          include: {
            week: {
              select: {
                weekNumber: true,
                year: true,
                enemyName: true,
                result: true,
              },
            },
          },
        });

        // Convertir BigInt en string
        ranking = participants.map((p) => ({
          ...p,
          powerGain: p.powerGain.toString(),
          powerLoss: p.powerLoss.toString(),
        }));

        const totalWeeks = await prisma.vSWeek.count({
          where: { isCompleted: true },
        });

        metadata = {
          totalCompletedWeeks: totalWeeks,
          type: "historical",
        };
        break;
      }

      case "global": {
        // Statistiques globales par joueur (agrégées)
        const result = await prisma.vSParticipant.groupBy({
          by: ["memberPseudo"],
          _sum: {
            kills: true,
            deaths: true,
            powerGain: true,
            powerLoss: true,
          },
          _avg: {
            participation: true,
          },
          _count: {
            weekId: true,
          },
          orderBy: {
            _sum: {
              kills: "desc",
            },
          },
          take: limit,
        });

        // Convertir BigInt en string et formater
        ranking = result.map((r) => ({
          memberPseudo: r.memberPseudo,
          totalKills: r._sum.kills || 0,
          totalDeaths: r._sum.deaths || 0,
          totalPowerGain: r._sum.powerGain?.toString() || "0",
          totalPowerLoss: r._sum.powerLoss?.toString() || "0",
          avgParticipation: Math.round(r._avg.participation || 0),
          weeksParticipated: r._count.weekId,
          kdRatio: r._sum.deaths
            ? ((r._sum.kills || 0) / r._sum.deaths).toFixed(2)
            : (r._sum.kills || 0).toString(),
        }));

        metadata = {
          type: "global",
          totalPlayers: result.length,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: "Type de classement non supporté" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      ranking,
      metadata,
      count: ranking.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des classements VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
