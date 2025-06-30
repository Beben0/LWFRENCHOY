// @ts-nocheck
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Historique VS d'un membre (par semaine, par jour)
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

    const memberId = context.params.id;

    // Récupérer tous les VS où ce membre a participé
    const participations = await prisma.vSParticipant.findMany({
      where: { memberId },
      include: {
        week: {
          select: {
            id: true,
            weekNumber: true,
            year: true,
            startDate: true,
            endDate: true,
            title: true,
            enemyName: true,
            status: true,
            result: true,
          },
        },
        dailyResults: {
          select: {
            dayNumber: true,
            date: true,
            mvpPoints: true,
            kills: true,
            deaths: true,
            powerGain: true,
            powerLoss: true,
            attacks: true,
            defenses: true,
            participated: true,
            notes: true,
          },
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: [{ week: { startDate: "desc" } }],
    });

    return NextResponse.json(participations);
  } catch (error) {
    console.error("Erreur historique VS membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
