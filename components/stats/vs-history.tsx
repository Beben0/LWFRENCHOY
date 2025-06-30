"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Crown,
  Shield,
  Skull,
  Sword,
  Target,
  Trophy,
  Users,
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
  status: "PREPARATION" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  isCompleted: boolean;
  result?: "VICTORY" | "DEFEAT" | "DRAW";
  days: VSDay[];
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
  result?: "VICTORY" | "DEFEAT" | "DRAW";
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
  kd_ratio: string;
  net_power: string;
}

interface VSHistoryProps {
  className?: string;
}

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

export function VSHistory({ className = "" }: VSHistoryProps) {
  const [vsWeeks, setVSWeeks] = useState<VSWeek[]>([]);
  const [currentRanking, setCurrentRanking] = useState<VSParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "current" | "global">(
    "history"
  );
  const [metadata, setMetadata] = useState<any>({});

  const loadVSData = async () => {
    try {
      setLoading(true);

      // Charger l'historique des semaines VS
      const historyResponse = await fetch("/api/vs?limit=10");
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setVSWeeks(historyData.weeks || []);
        setMetadata(historyData.metadata || {});
      }

      // Charger le classement actuel
      const rankingResponse = await fetch(
        "/api/vs/rankings?type=current&limit=10"
      );
      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json();
        setCurrentRanking(rankingData.ranking || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des VS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVSData();
  }, []);

  if (loading) {
    return (
      <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Sword className="w-6 h-6 animate-spin mr-2 text-orange-400" />
            <span className="text-gray-300">Chargement des VS...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec stats globales */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Sword className="w-6 h-6 text-orange-400" />
            Historique des VS (Versus)
          </CardTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {metadata.total || 0}
              </div>
              <div className="text-sm text-gray-400">Total semaines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {metadata.victories || 0}
              </div>
              <div className="text-sm text-gray-400">Victoires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {metadata.defeats || 0}
              </div>
              <div className="text-sm text-gray-400">Défaites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {metadata.winRate || 0}%
              </div>
              <div className="text-sm text-gray-400">Taux victoire</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("history")}
          className={`flex-1 ${
            activeTab === "history"
              ? "bg-orange-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Historique
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("current")}
          className={`flex-1 ${
            activeTab === "current"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Crown className="w-4 h-4 mr-2" />
          Classement
        </Button>
      </div>

      {/* Contenu selon l'onglet */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {vsWeeks.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <Sword className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Aucun VS enregistré
                </h3>
                <p className="text-gray-400">
                  L'historique des VS apparaîtra ici une fois qu'ils seront
                  ajoutés
                </p>
              </CardContent>
            </Card>
          ) : (
            vsWeeks.map((week) => (
              <Card key={week.id} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">
                        Semaine {week.weekNumber}/{week.year}
                        {week.title && ` - ${week.title}`}
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        {week.enemyName && `vs ${week.enemyName} • `}
                        {week._count.participants} participants
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getResultColor(week.result)}>
                        {getResultIcon(week.result)}
                        <span className="ml-1">
                          {week.result === "VICTORY" && "Victoire"}
                          {week.result === "DEFEAT" && "Défaite"}
                          {week.result === "DRAW" && "Égalité"}
                          {!week.result && "En cours"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Score final */}
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Score Final
                      </h4>
                      <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                        <span className="text-blue-400">
                          {week.allianceScore}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="text-red-400">{week.enemyScore}</span>
                      </div>
                    </div>

                    {/* Résultats par jour */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Résultats par jour
                      </h4>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }, (_, i) => {
                          const day = week.days.find(
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

      {activeTab === "current" && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Classement de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentRanking.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Aucun classement disponible
                </h3>
                <p className="text-gray-400">
                  Le classement apparaîtra quand les données VS seront ajoutées
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentRanking.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg"
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
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {participant.memberPseudo}
                      </div>
                      <div className="text-sm text-gray-400">
                        K/D: {participant.kd_ratio} • Participation:{" "}
                        {participant.participation}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-400">
                        {participant.kills}
                      </div>
                      <div className="text-xs text-gray-400">kills</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
