// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Statistiques des membres VS
export async function GET(request: NextRequest) {
  try {
    // Public endpoint - allow access for VS stats viewing

    // Récupérer tous les participants VS avec leurs données quotidiennes
    const participants = await prisma.vSParticipant.findMany({
      include: {
        week: {
          select: {
            title: true,
            weekNumber: true,
            year: true,
            status: true,
          },
        },
        dailyResults: {
          select: {
            mvpPoints: true,
            participated: true,
            kills: true,
            dayNumber: true,
          },
        },
        member: {
          select: { pseudo: true },
        },
      },
    });

    // Regrouper les données par membre
    const memberStatsMap = new Map();

    participants.forEach((participant) => {
      const memberId = participant.memberId;
      const memberPseudo =
        (participant as any).memberPseudo || participant.member?.pseudo || "?";

      if (!memberStatsMap.has(memberId)) {
        memberStatsMap.set(memberId, {
          memberId,
          memberPseudo,
          totalPoints: 0,
          totalKills: 0,
          totalParticipation: 0,
          weekCount: 0,
          weeks: [],
          participationDays: 0,
          totalDays: 0,
        });
      }

      const memberStats = memberStatsMap.get(memberId);

      // Calculer les points totaux pour cette semaine
      const weekPoints = participant.dailyResults.reduce(
        (sum, day) => sum + (day.mvpPoints || 0),
        0
      );

      const weekKills = participant.dailyResults.reduce(
        (sum, day) => sum + (day.kills || 0),
        0
      );

      const participatedDays = participant.dailyResults.filter(
        (day) => day.participated
      ).length;

      // Ajouter aux totaux
      memberStats.totalPoints += weekPoints;
      memberStats.totalKills += weekKills;
      memberStats.weekCount += 1;
      memberStats.participationDays += participatedDays;
      memberStats.totalDays += participant.dailyResults.length;

      // Garder trace de la meilleure semaine
      memberStats.weeks.push({
        weekTitle:
          participant.week.title || `Semaine ${participant.week.weekNumber}`,
        points: weekPoints,
        kills: weekKills,
        year: participant.week.year,
        weekNumber: participant.week.weekNumber,
      });
    });

    // Finaliser les statistiques
    const memberStats = Array.from(memberStatsMap.values()).map((stats) => {
      // Calculer la moyenne des points
      const averagePoints =
        stats.weekCount > 0 ? stats.totalPoints / stats.weekCount : 0;

      // Calculer le pourcentage de participation
      const totalParticipation =
        stats.totalDays > 0
          ? (stats.participationDays / stats.totalDays) * 100
          : 0;

      // Trouver la meilleure semaine
      const bestWeek = stats.weeks.reduce(
        (best: { weekTitle: string; points: number }, week: any) =>
          week.points > best.points ? week : best,
        { weekTitle: "Aucune", points: 0 }
      );

      return {
        memberId: stats.memberId,
        memberPseudo: stats.memberPseudo,
        totalPoints: stats.totalPoints,
        totalKills: stats.totalKills,
        totalParticipation,
        weekCount: stats.weekCount,
        averagePoints,
        bestWeek: {
          weekTitle: bestWeek.weekTitle,
          points: bestWeek.points,
        },
      };
    });

    // Trier par points totaux décroissants
    memberStats.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json(memberStats);
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
