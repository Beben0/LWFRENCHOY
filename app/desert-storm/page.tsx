"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { DesertStormManager } from "@/components/desert-storm/desert-storm-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import { formatDate } from "@/lib/utils";
import {
  BarChart3,
  CalendarDays,
  Clock,
  Crown,
  History,
  Shield,
  Sword,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DesertStormEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  enemyTeamAAllianceName?: string;
  enemyTeamBAllianceName?: string;
  enemyTeamAScore: number;
  enemyTeamBScore: number;
  status: "PREPARATION" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  result?: "TEAM_A_VICTORY" | "TEAM_B_VICTORY" | "DRAW";
  participants: DesertStormParticipant[];
  _count: {
    participants: number;
  };
}

interface DesertStormParticipant {
  id: string;
  team: "TEAM_A" | "TEAM_B";
  totalKills: number;
  totalDeaths: number;
  totalDamage: string;
  powerGain: string;
  powerLoss: string;
  participation: number;
  rank?: number;
  rewards: string[];
  points: number;
  isSubstitute: boolean;
  member: {
    id: string;
    pseudo: string;
    level: number;
    power: string;
  };
}

const statusConfig = {
  PREPARATION: {
    label: "Préparation",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Clock,
  },
  ACTIVE: {
    label: "En cours",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: Zap,
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: Trophy,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: Shield,
  },
};

const teamConfig = {
  TEAM_A: {
    name: "Équipe A",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Shield,
  },
  TEAM_B: {
    name: "Équipe B",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: Sword,
  },
};

export default function DesertStormPage() {
  const [events, setEvents] = useState<DesertStormEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type Tab = "current" | "history" | "rankings" | "detail";
  const [activeTab, setActiveTab] = useState<Tab>("current");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showSubs, setShowSubs] = useState<{
    [key in "TEAM_A" | "TEAM_B"]: boolean;
  }>({
    TEAM_A: false,
    TEAM_B: false,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/desert-storm");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des événements");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const getTopParticipants = (event: DesertStormEvent, limit = 3) => {
    return event.participants
      .filter((p) => p.member)
      .slice()
      .sort((a, b) => b.points - a.points || b.totalKills - a.totalKills)
      .slice(0, limit);
  };

  const getTeamScore = (event: DesertStormEvent, team: "TEAM_A" | "TEAM_B") => {
    return team === "TEAM_A" ? event.teamAScore : event.teamBScore;
  };

  const getEnemyScore = (
    event: DesertStormEvent,
    team: "TEAM_A" | "TEAM_B"
  ) => {
    return team === "TEAM_A" ? event.enemyTeamAScore : event.enemyTeamBScore;
  };

  const getEnemyAlliance = (
    event: DesertStormEvent,
    team: "TEAM_A" | "TEAM_B"
  ) => {
    return team === "TEAM_A"
      ? event.enemyTeamAAllianceName || "Alliance A"
      : event.enemyTeamBAllianceName || "Alliance B";
  };

  const getTeamName = (event: DesertStormEvent, team: "TEAM_A" | "TEAM_B") => {
    return team === "TEAM_A" ? event.teamAName : event.teamBName;
  };

  // Agréger les participants pour un classement global
  const aggregatedRankings = events
    .flatMap((e) => e.participants.filter((p) => p.member))
    .reduce<
      Record<
        string,
        {
          member: DesertStormParticipant["member"];
          points: number;
          kills: number;
          appearances: number;
        }
      >
    >((acc, p) => {
      if (!p.member) return acc;
      if (!acc[p.member.id]) {
        acc[p.member.id] = {
          member: p.member,
          points: 0,
          kills: 0,
          appearances: 0,
        };
      }
      acc[p.member.id].points += p.points;
      acc[p.member.id].kills += p.totalKills;
      acc[p.member.id].appearances += 1;
      return acc;
    }, {});

  const aggregateByTeam = (team: "TEAM_A" | "TEAM_B") =>
    Object.values(
      events
        .flatMap((e) =>
          e.participants.filter((p) => p.team === team && p.member)
        )
        .reduce<
          Record<
            string,
            {
              member: DesertStormParticipant["member"];
              points: number;
              kills: number;
            }
          >
        >((acc, p) => {
          if (!p.member) return acc;
          if (!acc[p.member.id]) {
            acc[p.member.id] = { member: p.member, points: 0, kills: 0 };
          }
          acc[p.member.id].points += p.points;
          acc[p.member.id].kills += p.totalKills;
          return acc;
        }, {})
    )
      .sort((a, b) => b.points - a.points || b.kills - a.kills)
      .slice(0, 15);

  const rankingsA = aggregateByTeam("TEAM_A");
  const rankingsB = aggregateByTeam("TEAM_B");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <Translate>Chargement...</Translate>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-red-500">
          <Translate>Erreur</Translate>: {error}
        </div>
      </div>
    );
  }

  const activeEvents = events.filter((e) => e.status === "ACTIVE");
  const upcomingEvents = events.filter((e) => e.status === "PREPARATION");
  const completedEvents = events.filter((e) => e.status === "COMPLETED");

  // Stats globales
  const statsTotal = events.length;
  const statsVictories = completedEvents.filter((e) =>
    ["TEAM_A_VICTORY", "TEAM_B_VICTORY"].includes(e.result as any)
  ).length;
  const statsDefeats = completedEvents.filter(
    (e) => e.result === "DRAW" || !e.result
  ).length;
  const statsWinRate = statsTotal
    ? Math.round((statsVictories / statsTotal) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8 text-orange-500" />
            <Translate>Desert Storm</Translate>
          </h1>
          <p className="text-muted-foreground">
            <Translate>Événements de combat entre équipes</Translate>
          </p>
        </div>

        <div className="flex gap-2">
          <PermissionGuard permission="create_desert_storm">
            <Link href="/admin/desert-storm">
              <Button>
                <Crown className="w-4 h-4 mr-2" />
                <Translate>Administration</Translate>
              </Button>
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="edit_desert_storm_results">
            <Link href="/admin/desert-storm/quick-entry">
              <Button variant="outline">
                <Target className="w-4 h-4 mr-2" />
                <Translate>Saisie rapide</Translate>
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats globales */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{statsTotal}</div>
            <div className="text-sm text-gray-400">
              <Translate>Événements</Translate>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {statsVictories}
            </div>
            <div className="text-sm text-gray-400">
              <Translate>Victoires</Translate>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {statsDefeats}
            </div>
            <div className="text-sm text-gray-400">
              <Translate>Défaites</Translate>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {statsWinRate}%
            </div>
            <div className="text-sm text-gray-400">
              <Translate>Win rate</Translate>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <div className="flex gap-2 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("current")}
          className={`flex-1 ${
            activeTab === "current"
              ? "bg-orange-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Zap className="w-4 h-4 mr-2" />
          <Translate>En cours</Translate>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("history")}
          className={`flex-1 ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <History className="w-4 h-4 mr-2" />
          <Translate>Historique</Translate>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("rankings")}
          className={`flex-1 ${
            activeTab === "rankings"
              ? "bg-green-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Trophy className="w-4 h-4 mr-2" />
          <Translate>Classements</Translate>
        </Button>
        {selectedEventId && (
          <Button
            variant="ghost"
            onClick={() => setActiveTab("detail")}
            className={`flex-1 ${
              activeTab === "detail"
                ? "bg-yellow-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <Translate>Détail</Translate>
          </Button>
        )}
      </div>

      {/* Événements en cours */}
      {activeTab === "current" && activeEvents.length > 0 && (
        <div className="space-y-6">
          {activeEvents.map((activeEvent) => (
            <Card
              key={activeEvent.id}
              className="border-orange-500/20 bg-orange-500/5"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <Translate>Événement en cours</Translate>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{activeEvent.title}</h3>
                  <Badge className={statusConfig[activeEvent.status].color}>
                    {(() => {
                      const IconComponent =
                        statusConfig[activeEvent.status].icon;
                      return <IconComponent className="w-3 h-3 mr-1" />;
                    })()}
                    <Translate>
                      {statusConfig[activeEvent.status].label}
                    </Translate>
                  </Badge>
                </div>

                {activeEvent.description && (
                  <p className="text-muted-foreground">
                    {activeEvent.description}
                  </p>
                )}

                {/* Scores VS */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Team A */}
                  <Card className="border-blue-500/20">
                    <CardContent className="p-4 text-center space-y-1">
                      <div className="text-sm font-medium text-blue-500 flex items-center justify-center gap-1">
                        <Shield className="w-4 h-4" /> {activeEvent.teamAName}
                        <span className="mx-1">vs</span>
                        {getEnemyAlliance(activeEvent, "TEAM_A")}
                      </div>
                      <div className="text-xl font-bold">
                        {activeEvent.teamAScore}
                        <span className="mx-1">/</span>
                        <span className="text-orange-500">
                          {activeEvent.enemyTeamAScore}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Team B */}
                  <Card className="border-red-500/20">
                    <CardContent className="p-4 text-center space-y-1">
                      <div className="text-sm font-medium text-red-500 flex items-center justify-center gap-1">
                        <Sword className="w-4 h-4" /> {activeEvent.teamBName}
                        <span className="mx-1">vs</span>
                        {getEnemyAlliance(activeEvent, "TEAM_B")}
                      </div>
                      <div className="text-xl font-bold">
                        {activeEvent.teamBScore}
                        <span className="mx-1">/</span>
                        <span className="text-orange-500">
                          {activeEvent.enemyTeamBScore}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top participants */}
                <div>
                  <h4 className="text-lg font-semibold flex items-center gap-2 mt-6">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Top 3
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    {getTopParticipants(activeEvent, 3).map((p, idx) => (
                      <Card
                        key={p.member.id}
                        className="border-gray-700 bg-gray-800/50"
                      >
                        <CardContent className="p-4 text-center space-y-1">
                          <div className="text-xl font-bold text-white">
                            #{idx + 1} {p.member.pseudo}
                          </div>
                          <div className="text-sm text-gray-300">
                            {p.points} pts, {p.totalKills} kills
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Bouton détail */}
                <div className="flex justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedEventId(activeEvent.id);
                      setActiveTab("detail");
                    }}
                  >
                    <Translate>Détails</Translate>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Événements terminés */}
      {activeTab === "history" && completedEvents.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            <Translate>Événements terminés</Translate>
          </h2>
          <div className="grid gap-4">
            {completedEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEventId(event.id);
                  setActiveTab("detail");
                }}
              >
                <Card
                  className={
                    selectedEventId === event.id ? "border-orange-500" : ""
                  }
                >
                  <CardContent className="p-4 cursor-pointer hover:bg-gray-800/40">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <div className="flex items-center gap-2">
                        {event.result && (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            <Trophy className="w-3 h-3 mr-1" />
                            <Translate>
                              {event.result === "TEAM_A_VICTORY"
                                ? event.teamAName
                                : event.result === "TEAM_B_VICTORY"
                                ? event.teamBName
                                : "Égalité"}
                            </Translate>
                          </Badge>
                        )}
                        <Badge className={statusConfig[event.status].color}>
                          {(() => {
                            const IconComponent =
                              statusConfig[event.status].icon;
                            return <IconComponent className="w-3 h-3 mr-1" />;
                          })()}
                          <Translate>
                            {statusConfig[event.status].label}
                          </Translate>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-sm">
                        <span className="text-blue-500 font-medium">
                          {event.teamAName}
                        </span>
                        : {event.teamAScore}
                      </div>
                      <div className="text-sm">
                        <span className="text-red-500 font-medium">
                          {event.teamBName}
                        </span>
                        : {event.teamBScore}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {formatDate(new Date(event.startDate))}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <Translate>
                          {event._count.participants} participants
                        </Translate>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                      <div>
                        {event.teamAName} vs{" "}
                        {event.enemyTeamAAllianceName ?? "?"} :
                        <span className="ml-1 font-medium text-white">
                          {event.teamAScore} / {event.enemyTeamAScore}
                        </span>
                      </div>
                      <div>
                        {event.teamBName} vs{" "}
                        {event.enemyTeamBAllianceName ?? "?"} :
                        <span className="ml-1 font-medium text-white">
                          {event.teamBScore} / {event.enemyTeamBScore}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings tab */}
      {activeTab === "rankings" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team A */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-500">
                <Shield className="w-4 h-4" />{" "}
                {events[0]?.teamAName ?? "Équipe A"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingsA.map((r, idx) => (
                <div
                  key={r.member.id}
                  className="flex items-center justify-between p-2 border-b last:border-none"
                >
                  <span className="font-medium">
                    #{idx + 1} {r.member.pseudo}
                  </span>
                  <span className="text-sm">
                    {r.points} pts / {r.kills} K
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Team B */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Sword className="w-4 h-4" />{" "}
                {events[0]?.teamBName ?? "Équipe B"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankingsB.map((r, idx) => (
                <div
                  key={r.member.id}
                  className="flex items-center justify-between p-2 border-b last:border-none"
                >
                  <span className="font-medium">
                    #{idx + 1} {r.member.pseudo}
                  </span>
                  <span className="text-sm">
                    {r.points} pts / {r.kills} K
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "detail" && selectedEventId && (
        <DesertStormManager eventId={selectedEventId} />
      )}

      {/* Message si aucun événement */}
      {events.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              <Translate>Aucun événement Desert Storm</Translate>
            </h3>
            <p className="text-muted-foreground">
              <Translate>
                Aucun événement n'est actuellement planifié.
              </Translate>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
