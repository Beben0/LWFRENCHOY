import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "view_admin_panel")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    // Récupérer les vraies données de la base
    const [
      totalMembers,
      activeMembers,
      totalEvents,
      upcomingEvents,
      trainSlots,
      assignedSlots,
      totalPower,
      inactiveMembers,
      recentActivity,
    ] = await Promise.all([
      // Total des membres
      prisma.member.count(),

      // Membres actifs
      prisma.member.count({
        where: { status: "ACTIVE" },
      }),

      // Total des événements
      prisma.event.count(),

      // Événements à venir
      prisma.event.count({
        where: {
          startDate: {
            gte: new Date(),
          },
        },
      }),

      // Total des créneaux de train (utiliser TrainInstance maintenant)
      prisma.trainInstance.count({
        where: { isArchived: false },
      }),

      // Créneaux assignés
      prisma.trainInstance.count({
        where: {
          isArchived: false,
          conductorId: {
            not: null,
          },
        },
      }),

      // Puissance totale de l'alliance
      prisma.member.aggregate({
        where: { status: "ACTIVE" },
        _sum: { power: true },
      }),

      // Membres inactifs (plus de 7 jours)
      prisma.member.count({
        where: {
          lastActive: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Activité récente (membres connectés dans les 24h)
      prisma.member.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const stats = {
      totalMembers,
      activeMembers,
      totalEvents,
      upcomingEvents,
      trainSlots,
      assignedSlots,
      totalPower: Number(totalPower._sum.power || BigInt(0)),
      inactiveMembers,
      recentActivity,
      coveragePercent:
        trainSlots > 0 ? Math.round((assignedSlots / trainSlots) * 100) : 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des stats admin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
