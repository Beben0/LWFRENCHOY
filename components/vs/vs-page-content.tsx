"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import {
  BarChart3,
  Crown,
  History,
  Medal,
  Shield,
  Skull,
  Sword,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
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
  days: VSDay[];
  participants: VSParticipant[];
  _count: {
    participants: number;
  };
}

interface VSDay {
  id: string;
  dayNumber: number;
  date: string;
  allianceScore: number;
  enemyScore: number;
  result?: string;
  events: string[];
}

interface VSParticipant {
  id: string;
  memberPseudo: string;
  kills: number;
  deaths: number;
  powerGain: string;
  powerLoss: string;
  participation: number;
  rank: number;
  rewards: string[];
  dailyResults?: VSParticipantDay[];
  points: number;
  victoryPercentage?: number;
}

interface VSParticipantDay {
  id: string;
  dayNumber: number;
  date: string;
  kills: number;
  deaths: number;
  powerGain: string;
  powerLoss: string;
  attacks: number;
  defenses: number;
  participated: boolean;
  mvpPoints: number;
  events: string[];
  notes?: string;
}

type ActiveTab = "current" | "history" | "rankings" | "details";

export function VSPageContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("current");
  const [vsWeeks, setVSWeeks] = useState<VSWeek[]>([]);
  const [currentWeek, setCurrentWeek] = useState<VSWeek | null>(null);
  const [rankings, setRankings] = useState<VSParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<VSWeek | null>(null);
  const [metadata, setMetadata] = useState<any>({});

  const loadVSData = async () => {
    try {
      setLoading(true);

      // Charger l'historique des semaines VS avec les jours inclus
      const historyResponse = await fetch(
        "/api/vs?limit=20&includeDays=true&includeParticipants=true"
      );
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();

        // L'API peut renvoyer soit {weeks:[...], metadata:{...}} soit [...]
        const weeks: VSWeek[] = Array.isArray(historyData)
          ? historyData
          : historyData.weeks || [];

        setVSWeeks(weeks);

        // Calculer les métadonnées côté client si non fournies
        const meta = Array.isArray(historyData.metadata)
          ? historyData.metadata
          : historyData.metadata || {};

        if (!meta.total) {
          const victories = weeks.filter((w) => w.result === "VICTORY").length;
          const defeats = weeks.filter((w) => w.result === "DEFEAT").length;
          const total = weeks.length;
          const winRate = total > 0 ? Math.round((victories / total) * 100) : 0;
          setMetadata({ total, victories, defeats, winRate });
        } else {
          setMetadata(meta);
        }

        // Semaine courante = première de la liste (plus récente)
        const current = weeks[0];
        if (
          current &&
          (current.status === "ACTIVE" || current.status === "PREPARATION")
        ) {
          setCurrentWeek(current);
          setSelectedWeek(current);
        }
      }

      // Charger les classements
      const rankingResponse = await fetch(
        "/api/vs/rankings?type=current&limit=20"
      );
      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json();
        setRankings(rankingData.ranking || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des VS:", error);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case "VICTORY":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "DEFEAT":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "DRAW":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getResultIcon = (result?: string) => {
    switch (result) {
      case "VICTORY":
        return <Trophy className="w-4 h-4" />;
      case "DEFEAT":
        return <Skull className="w-4 h-4" />;
      case "DRAW":
        return <Shield className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const formatKDRatio = (kills: number, deaths: number) => {
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  };

  function calculateVictoryPercentage(participant: VSParticipant): number {
    if (!participant.dailyResults || participant.dailyResults.length === 0)
      return 0;

    const participatedDays = participant.dailyResults.filter(
      (day) => day.participated
    ).length;
    if (participatedDays === 0) return 0;

    const victoriesCount = participant.dailyResults.filter(
      (day) => day.participated && day.mvpPoints > 0
    ).length;

    return Math.round((victoriesCount / participatedDays) * 100);
  }

  useEffect(() => {
    loadVSData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <Sword className="w-16 h-16 animate-spin text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              <Translate>Chargement des VS…</Translate>
            </h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats globales */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-white">
            <Sword className="w-8 h-8 text-orange-400" />
            <Translate>VS (Versus Wars)</Translate>
          </CardTitle>
          <p className="text-gray-400">
            <Translate>
              Historique des guerres, classements et détails des participants
            </Translate>
          </p>

          {/* Stats globales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="text-center bg-gray-800/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {metadata.total || 0}
              </div>
              <div className="text-sm text-gray-400">
                <Translate>Total VS</Translate>
              </div>
            </div>
            <div className="text-center bg-green-600/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {metadata.victories || 0}
              </div>
              <div className="text-sm text-gray-400">
                <Translate>Victoires</Translate>
              </div>
            </div>
            <div className="text-center bg-red-600/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {metadata.defeats || 0}
              </div>
              <div className="text-sm text-gray-400">
                <Translate>Défaites</Translate>
              </div>
            </div>
            <div className="text-center bg-blue-600/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {metadata.winRate || 0}%
              </div>
              <div className="text-sm text-gray-400">
                <Translate>Taux victoire</Translate>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation par onglets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
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
          <span className="hidden sm:inline">
            <Translate>VS Actuel</Translate>
          </span>
          <span className="sm:hidden">
            <Translate>Actuel</Translate>
          </span>
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
          <span className="hidden sm:inline">
            <Translate>Historique</Translate>
          </span>
          <span className="sm:hidden">
            <Translate>Hist.</Translate>
          </span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("rankings")}
          className={`flex-1 ${
            activeTab === "rankings"
              ? "bg-purple-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Crown className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">
            <Translate>Classements</Translate>
          </span>
          <span className="sm:hidden">
            <Translate>Rank</Translate>
          </span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("details")}
          className={`flex-1 ${
            activeTab === "details"
              ? "bg-green-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">
            <Translate>Détails</Translate>
          </span>
          <span className="sm:hidden">
            <Translate>Dét.</Translate>
          </span>
        </Button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === "current" && (
        <div className="space-y-6">
          {currentWeek ? (
            <>
              {/* VS Actuel */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-white">
                        <Translate>Semaine</Translate> {currentWeek.weekNumber}/
                        {currentWeek.year}
                        {currentWeek.title && ` - ${currentWeek.title}`}
                      </CardTitle>
                      <p className="text-gray-400 mt-1">
                        {currentWeek.enemyName && <Translate>vs</Translate>}{" "}
                        {currentWeek.enemyName && `${currentWeek.enemyName} • `}
                        {currentWeek._count.participants}{" "}
                        <Translate>participants</Translate> •{" "}
                        {currentWeek.status}
                      </p>
                    </div>
                    {currentWeek.result && (
                      <Badge className={getResultColor(currentWeek.result)}>
                        {getResultIcon(currentWeek.result)}
                        <span className="ml-1">
                          {currentWeek.result === "VICTORY" && (
                            <Translate>Victoire</Translate>
                          )}
                          {currentWeek.result === "DEFEAT" && (
                            <Translate>Défaite</Translate>
                          )}
                          {currentWeek.result === "DRAW" && (
                            <Translate>Égalité</Translate>
                          )}
                        </span>
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Score actuel */}
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        <Translate>Score Actuel</Translate>
                      </h4>
                      <div className="flex items-center justify-center gap-4 text-3xl font-bold">
                        <span className="text-blue-400">
                          {currentWeek.allianceScore > 0
                            ? currentWeek.allianceScore
                            : currentWeek.participants.reduce(
                                (sum, p) => sum + (p.points || 0),
                                0
                              )}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="text-red-400">
                          {currentWeek.enemyScore}
                        </span>
                      </div>
                    </div>

                    {/* Résultats par jour (6 jours) */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        <Translate>Résultats par jour</Translate>
                      </h4>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 6 }, (_, i) => {
                          const day = currentWeek.days?.find(
                            (d) => d.dayNumber === i + 1
                          );
                          const hasResult =
                            day &&
                            (day.allianceScore > 0 || day.enemyScore > 0);

                          return (
                            <div
                              key={i}
                              className={`p-2 rounded text-center text-xs ${
                                !hasResult
                                  ? "bg-gray-700/50 text-gray-500"
                                  : day!.allianceScore > day!.enemyScore
                                  ? "bg-green-600/30 text-green-400"
                                  : day!.allianceScore < day!.enemyScore
                                  ? "bg-red-600/30 text-red-400"
                                  : "bg-yellow-600/30 text-yellow-400"
                              }`}
                            >
                              <div className="font-semibold">J{i + 1}</div>
                              {hasResult && (
                                <div className="text-xs">
                                  {day!.allianceScore}-{day!.enemyScore}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top participants */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      <Translate>Top Participants</Translate>
                    </h4>
                    <div className="space-y-2">
                      {currentWeek.participants
                        .slice(0, 5)
                        .map((participant, index) => (
                          <div
                            key={participant.id}
                            className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg"
                          >
                            <div className="flex-shrink-0 w-8 text-center">
                              {index < 3 ? (
                                <Crown
                                  className={`w-5 h-5 mx-auto ${
                                    index === 0
                                      ? "text-yellow-400"
                                      : index === 1
                                      ? "text-gray-300"
                                      : "text-orange-400"
                                  }`}
                                />
                              ) : (
                                <span className="text-gray-400 font-semibold">
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate">
                                {participant.memberPseudo ||
                                  (participant as any).member?.pseudo ||
                                  "?"}
                              </div>
                              <div className="text-sm text-gray-400">
                                {/* Statistiques détaillées supprimées */}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-400">
                                {participant.points}
                              </div>
                              <div className="text-xs text-gray-400">
                                points
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  <Translate>Aucun VS en cours</Translate>
                </h3>
                <p className="text-gray-400">
                  <Translate>
                    Le prochain VS apparaîtra ici quand il sera programmé
                  </Translate>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              <Translate>Historique des VS</Translate>
            </h3>
          </div>

          {vsWeeks.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <Sword className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  <Translate>Aucun historique VS</Translate>
                </h3>
                <p className="text-gray-400">
                  <Translate>L'historique des VS apparaîtra ici</Translate>
                </p>
              </CardContent>
            </Card>
          ) : (
            vsWeeks.map((week) => (
              <Card
                key={week.id}
                className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedWeek(week);
                  setActiveTab("details");
                }}
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg text-white">
                        <Translate>Semaine</Translate> {week.weekNumber}/
                        {week.year}
                        {week.title && ` - ${week.title}`}
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        {week.enemyName && <Translate>vs</Translate>}{" "}
                        {week.enemyName && `${week.enemyName} • `}
                        {week._count.participants}{" "}
                        <Translate>participants</Translate> • {week.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {week.result && (
                        <Badge className={getResultColor(week.result)}>
                          {getResultIcon(week.result)}
                          <span className="ml-1">
                            {week.result === "VICTORY" && (
                              <Translate>Victoire</Translate>
                            )}
                            {week.result === "DEFEAT" && (
                              <Translate>Défaite</Translate>
                            )}
                            {week.result === "DRAW" && (
                              <Translate>Égalité</Translate>
                            )}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Score final */}
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        <Translate>Score Final</Translate>
                      </h4>
                      <div className="flex items-center justify-center gap-4 text-xl font-bold">
                        <span className="text-blue-400">
                          {week.allianceScore > 0
                            ? week.allianceScore
                            : week.participants.reduce(
                                (s, p) => s + (p.points || 0),
                                0
                              )}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="text-red-400">{week.enemyScore}</span>
                      </div>
                    </div>

                    {/* Résultats par jour (6 jours) */}
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        <Translate>Résultats par jour</Translate>
                      </h4>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 6 }, (_, i) => {
                          const day = week.days?.find(
                            (d) => d.dayNumber === i + 1
                          );
                          const hasResult =
                            day &&
                            (day.allianceScore > 0 || day.enemyScore > 0);

                          return (
                            <div
                              key={i}
                              className={`p-2 rounded text-center text-xs ${
                                !hasResult
                                  ? "bg-gray-700/50 text-gray-500"
                                  : day!.allianceScore > day!.enemyScore
                                  ? "bg-green-600/30 text-green-400"
                                  : day!.allianceScore < day!.enemyScore
                                  ? "bg-red-600/30 text-red-400"
                                  : "bg-yellow-600/30 text-yellow-400"
                              }`}
                            >
                              <div className="font-semibold">J{i + 1}</div>
                              {hasResult && (
                                <div className="text-xs">
                                  {day!.allianceScore}-{day!.enemyScore}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "rankings" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              <Translate>Classements</Translate>
            </h3>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                <Translate>Top Performers</Translate>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankings.length === 0 ? (
                <div className="text-center py-8">
                  <Medal className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    <Translate>Aucun classement disponible</Translate>
                  </h3>
                  <p className="text-gray-400">
                    <Translate>
                      Les classements apparaîtront quand les VS seront actifs
                    </Translate>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rankings.map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-10 text-center">
                        {index < 3 ? (
                          <Crown
                            className={`w-6 h-6 mx-auto ${
                              index === 0
                                ? "text-yellow-400"
                                : index === 1
                                ? "text-gray-300"
                                : "text-orange-400"
                            }`}
                          />
                        ) : (
                          <span className="text-gray-400 font-bold text-lg">
                            #{index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-lg truncate">
                          {participant.memberPseudo ||
                            (participant as any).member?.pseudo ||
                            "?"}
                        </div>
                        <div className="text-sm text-gray-400">
                          {/* Statistiques détaillées supprimées */}
                        </div>
                        {participant.rewards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {participant.rewards.map((reward, i) => (
                              <Badge
                                key={i}
                                className="text-xs bg-yellow-600/20 text-yellow-400"
                              >
                                <Translate from="auto">{reward}</Translate>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-400">
                          {participant.points}
                        </div>
                        <div className="text-xs text-gray-400">
                          <Translate>points</Translate>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "details" && selectedWeek && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">
              <Translate>Détails</Translate> - <Translate>Semaine</Translate>{" "}
              {selectedWeek.weekNumber}/{selectedWeek.year}
            </h3>
          </div>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                <Translate>Résultats détaillés par participant</Translate>
              </CardTitle>
              <p className="text-gray-400">
                <Translate>
                  Performance quotidienne de chaque participant (6 jours de VS)
                </Translate>
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedWeek.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-gray-700/30 rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 text-center">
                          <span className="text-orange-400 font-bold">
                            #{participant.rank ?? "?"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-lg">
                            {participant.memberPseudo ||
                              (participant as any).member?.pseudo ||
                              "?"}
                          </h4>
                          <div className="text-sm text-gray-400">
                            <Translate>Total</Translate>: {participant.points}{" "}
                            <Translate>points</Translate>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-400">
                          {participant.victoryPercentage}%
                        </div>
                        <div className="text-xs text-gray-400">
                          <Translate>participation</Translate>
                        </div>
                      </div>
                    </div>

                    {/* Résultats quotidiens (6 jours) */}
                    <div className="grid grid-cols-6 gap-2 mt-3">
                      {Array.from({ length: 6 }, (_, dayIndex) => {
                        const dayResult = participant.dailyResults?.find(
                          (d) => d.dayNumber === dayIndex + 1
                        );

                        return (
                          <div
                            key={dayIndex}
                            className="bg-gray-800/50 p-2 rounded text-center text-xs"
                          >
                            <div className="font-semibold text-gray-300 mb-1">
                              J{dayIndex + 1}
                            </div>
                            {dayResult?.participated &&
                            dayResult?.mvpPoints > 0 ? (
                              <div className="text-yellow-400 font-bold text-sm">
                                ★{dayResult.mvpPoints}
                              </div>
                            ) : (
                              <div className="text-gray-500">-</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selectedWeek.participants.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      <Translate>Aucun participant</Translate>
                    </h3>
                    <p className="text-gray-400">
                      <Translate>
                        Les détails des participants apparaîtront ici
                      </Translate>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
