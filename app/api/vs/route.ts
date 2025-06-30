import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { VSWeekStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// GET - Liste des semaines VS
export async function GET(request: NextRequest) {
  try {
    // Public endpoint - allow access for VS viewing

    const url = new URL(request.url);
    const status = url.searchParams.get("status") as VSWeekStatus | null;
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const includeDays = url.searchParams.get("includeDays") === "true";
    const includeParticipants =
      url.searchParams.get("includeParticipants") === "true";

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const vsWeeks = await prisma.vSWeek.findMany({
      where,
      include: {
        _count: {
          select: {
            participants: true,
            days: true,
          },
        },
        days: includeDays,
        participants: includeParticipants
          ? {
              include: {
                member: true,
                dailyResults: true,
              },
            }
          : false,
      },
      orderBy: { startDate: "desc" },
      take: limit,
    });

    // Nettoyage serialization
    const safe = vsWeeks.map((w) => jsonify(w));
    return NextResponse.json(safe);
  } catch (error) {
    console.error("Erreur lors de la récupération des VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle semaine VS
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "create_vs_week")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, enemyName, title } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Dates de début et fin requises" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculer le numéro de semaine
    const year = start.getFullYear();
    const weekNumber = getWeekNumber(start);

    // Vérifier s'il existe déjà un VS pour cette semaine
    const existing = await prisma.vSWeek.findUnique({
      where: {
        year_weekNumber: {
          year,
          weekNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "VS déjà existant pour cette semaine",
          vsWeek: jsonify(existing),
        },
        { status: 409 }
      );
    }

    // Créer la semaine VS
    const vsWeek = await prisma.vSWeek.create({
      data: {
        weekNumber,
        year,
        startDate: start,
        endDate: end,
        title: title || `VS Semaine ${weekNumber}`,
        enemyName: enemyName || "Alliance Ennemie",
        status: VSWeekStatus.ACTIVE,
      },
    });

    // Créer 6 jours automatiquement (lundi à samedi)
    const days = [];
    for (let i = 0; i < 6; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + i);

      days.push({
        weekId: vsWeek.id,
        dayNumber: i + 1,
        date: dayDate,
      });
    }

    await prisma.vSDay.createMany({
      data: days,
    });

    return NextResponse.json(vsWeek, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
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
