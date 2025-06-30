"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import {
  Calendar,
  Crown,
  Filter,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface VSWeek {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  title?: string;
  allianceScore: number;
  enemyScore: number;
  enemyName?: string;
  status: string;
  isCompleted: boolean;
  result?: string;
  _count: {
    participants: number;
    days: number;
  };
}

interface MemberStats {
  memberPseudo: string;
  memberId: string;
  totalPoints: number;
  totalKills: number;
  totalParticipation: number;
  weekCount: number;
  averagePoints: number;
  bestWeek: {
    weekTitle: string;
    points: number;
  };
}

export default function VSHistoryPage() {
  const { data: session, status } = useSession();
  const [vsWeeks, setVsWeeks] = useState<VSWeek[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"weeks" | "members">("weeks");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !hasPermission(session, "view_vs")) {
      redirect("/auth/signin");
      return;
    }

    loadData();
  }, [session, status]);

  const loadData = async () => {
    try {
      // Charger toutes les semaines VS
      const weeksResponse = await fetch("/api/vs?limit=50");
      const weeksData = await weeksResponse.json();
      setVsWeeks(weeksData);

      // Charger les statistiques des membres
      await loadMemberStats();
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberStats = async () => {
    try {
      // Simuler le calcul des stats (à remplacer par une vraie API)
      const statsResponse = await fetch("/api/vs/stats/members");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMemberStats(statsData);
      }
    } catch (error) {
      console.error("Erreur chargement stats membres:", error);
    }
  };

  const filteredWeeks = vsWeeks.filter((week) => {
    const matchesStatus =
      selectedStatus === "ALL" || week.status === selectedStatus;
    const matchesSearch =
      !searchTerm ||
      week.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      week.enemyName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const filteredMembers = memberStats
    .filter(
      (member) =>
        !searchTerm ||
        member.memberPseudo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const getResultBadge = (
    result?: string,
    allianceScore?: number,
    enemyScore?: number
  ) => {
    if (!result && allianceScore !== undefined && enemyScore !== undefined) {
      if (allianceScore > enemyScore) result = "VICTORY";
      else if (allianceScore < enemyScore) result = "DEFEAT";
      else result = "DRAW";
    }

    switch (result) {
      case "VICTORY":
        return (
          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
            Victoire
          </span>
        );
      case "DEFEAT":
        return (
          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
            Défaite
          </span>
        );
      case "DRAW":
        return (
          <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
            Égalité
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
            En cours
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
            Actif
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
            Terminé
          </span>
        );
      case "PREPARATION":
        return (
          <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
            Préparation
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Chargement de l'historique...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-400 flex items-center gap-2">
            📈 Historique VS
          </h1>
          <p className="text-gray-400">
            Historique complet des guerres d'alliance et classements
          </p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {vsWeeks.length}
                </p>
                <p className="text-xs text-gray-400">VS total</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {vsWeeks.filter((w) => w.result === "VICTORY").length}
                </p>
                <p className="text-xs text-gray-400">Victoires</p>
              </div>
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {vsWeeks.filter((w) => w.result === "DEFEAT").length}
                </p>
                <p className="text-xs text-gray-400">Défaites</p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {vsWeeks.length > 0
                    ? Math.round(
                        (vsWeeks.filter((w) => w.result === "VICTORY").length /
                          vsWeeks.filter((w) => w.result).length) *
                          100
                      ) || 0
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-400">Taux victoire</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et sélecteur de vue */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={view === "weeks" ? "default" : "outline"}
                onClick={() => setView("weeks")}
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Semaines VS
              </Button>
              <Button
                variant={view === "members" ? "default" : "outline"}
                onClick={() => setView("members")}
                size="sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Classement Membres
              </Button>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    view === "weeks"
                      ? "Rechercher un VS..."
                      : "Rechercher un membre..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
                />
              </div>

              {view === "weeks" && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
                  >
                    <option value="ALL">Tous</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="PREPARATION">Préparation</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vue Semaines VS */}
      {view === "weeks" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Historique des semaines VS ({filteredWeeks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 font-semibold">Semaine</th>
                    <th className="text-left p-3 font-semibold">Période</th>
                    <th className="text-left p-3 font-semibold">Ennemi</th>
                    <th className="text-center p-3 font-semibold">Score</th>
                    <th className="text-center p-3 font-semibold">
                      Participants
                    </th>
                    <th className="text-center p-3 font-semibold">Résultat</th>
                    <th className="text-center p-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWeeks.map((week) => (
                    <tr
                      key={week.id}
                      className="border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer"
                    >
                      <td className="p-3">
                        <Link href={`/admin/vs/${week.id}`}>
                          <div>
                            <div className="font-medium">
                              {week.title || `Semaine ${week.weekNumber}`}
                            </div>
                            <div className="text-sm text-gray-400">
                              {week.year} - S{week.weekNumber}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>
                            {new Date(week.startDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                          <div className="text-gray-400">
                            au{" "}
                            {new Date(week.endDate).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">
                          {week.enemyName || "Alliance Ennemie"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-medium">
                          <span
                            className={
                              week.allianceScore > week.enemyScore
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {week.allianceScore}
                          </span>
                          {" - "}
                          <span
                            className={
                              week.enemyScore > week.allianceScore
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {week.enemyScore}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-blue-400 font-medium">
                          {week._count.participants}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {getResultBadge(
                          week.result,
                          week.allianceScore,
                          week.enemyScore
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(week.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue Classement Membres */}
      {view === "members" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Classement des membres ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 font-semibold">Rang</th>
                    <th className="text-left p-3 font-semibold">Membre</th>
                    <th className="text-center p-3 font-semibold">
                      Points Total
                    </th>
                    <th className="text-center p-3 font-semibold">
                      Moyenne/VS
                    </th>
                    <th className="text-center p-3 font-semibold">
                      Participation
                    </th>
                    <th className="text-center p-3 font-semibold">
                      VS Participés
                    </th>
                    <th className="text-left p-3 font-semibold">
                      Meilleure Semaine
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, index) => (
                    <tr
                      key={member.memberId}
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="font-bold text-lg">
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/admin/vs/member/${member.memberId}`}
                          className="text-yellow-400 hover:underline"
                        >
                          {member.memberPseudo}
                        </Link>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-yellow-400 font-bold text-lg">
                          {member.totalPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-blue-400 font-medium">
                          {Math.round(member.averagePoints).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-green-400 font-medium">
                          {Math.round(member.totalParticipation)}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-purple-400 font-medium">
                          {member.weekCount}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="font-medium">
                            {member.bestWeek.weekTitle}
                          </div>
                          <div className="text-orange-400">
                            {member.bestWeek.points.toLocaleString()} pts
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
