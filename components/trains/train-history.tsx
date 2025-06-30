"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Crown,
  Filter,
  History,
  Search,
  Train,
  Trophy,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TrainHistoryEntry {
  id: string;
  action: string;
  actorPseudo: string | null;
  targetPseudo: string | null;
  details: string | null;
  timestamp: Date;
  trainSlot: {
    day: string;
    departureTime: string;
  };
  trainInstance?: {
    dayOfWeek: string;
    departureTime: string;
  };
}

interface ConductorRankingEntry {
  pseudo: string;
  targetId: string | null;
  count: number;
  lastDate: Date | null;
  lastTrain: {
    day: string;
    departureTime: string;
  } | null;
}

interface TrainHistoryProps {
  show: boolean;
  onClose: () => void;
}

const dayLabels: { [key: string]: string } = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const actionLabels: { [key: string]: string } = {
  CONDUCTOR_ASSIGNED: "Conducteur assigné",
  CONDUCTOR_REMOVED: "Conducteur retiré",
  PASSENGER_JOINED: "Passager ajouté",
  PASSENGER_LEFT: "Passager parti",
  TIME_CHANGED: "Horaire modifié",
  TRAIN_CREATED: "Train créé",
  TRAIN_DELETED: "Train supprimé",
};

const actionIcons: { [key: string]: React.ReactNode } = {
  CONDUCTOR_ASSIGNED: <Crown className="w-4 h-4 text-green-500" />,
  CONDUCTOR_REMOVED: <X className="w-4 h-4 text-red-500" />,
  PASSENGER_JOINED: <User className="w-4 h-4 text-blue-500" />,
  PASSENGER_LEFT: <User className="w-4 h-4 text-gray-500" />,
  TIME_CHANGED: <Clock className="w-4 h-4 text-orange-500" />,
  TRAIN_CREATED: <Train className="w-4 h-4 text-green-500" />,
  TRAIN_DELETED: <Train className="w-4 h-4 text-red-500" />,
};

export function TrainHistory({ show, onClose }: TrainHistoryProps) {
  const [activeTab, setActiveTab] = useState<"history" | "ranking">("history");
  const [history, setHistory] = useState<TrainHistoryEntry[]>([]);
  const [ranking, setRanking] = useState<ConductorRankingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, rankingRes] = await Promise.all([
        fetch("/api/trains/history"),
        fetch("/api/trains/ranking"),
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      if (rankingRes.ok) {
        const rankingData = await rankingRes.json();
        setRanking(rankingData);
      }
    } catch (error) {
      console.error("Error loading train data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHistoryEntry = (entry: TrainHistoryEntry): string => {
    const actor = entry.actorPseudo || "Système";
    const target = entry.targetPseudo;
    const details = entry.details;

    switch (entry.action) {
      case "CONDUCTOR_ASSIGNED":
        return `${actor} a assigné ${target} comme conducteur`;
      case "CONDUCTOR_REMOVED":
        return `${actor} a retiré ${target} de la conduite`;
      case "PASSENGER_JOINED":
        return `${target} a rejoint le train`;
      case "PASSENGER_LEFT":
        return `${target} a quitté le train`;
      case "TIME_CHANGED":
        return `${actor} a modifié l'horaire${details ? ` (${details})` : ""}`;
      case "TRAIN_CREATED":
        return `${actor} a créé le train`;
      case "TRAIN_DELETED":
        return `${actor} a supprimé le train`;
      default:
        return `${actor} - ${actionLabels[entry.action] || entry.action}${
          target ? ` - ${target}` : ""
        }`;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 0) return "from-yellow-400 to-yellow-600"; // Or
    if (rank === 1) return "from-gray-300 to-gray-500"; // Argent
    if (rank === 2) return "from-amber-500 to-amber-700"; // Bronze
    return "from-blue-400 to-blue-600"; // Normal
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return "🥇";
    if (rank === 1) return "🥈";
    if (rank === 2) return "🥉";
    return "🏅";
  };

  const filteredHistory = history.filter((entry) => {
    const matchesSearch =
      searchTerm === "" ||
      entry.targetPseudo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.actorPseudo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatHistoryEntry(entry)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterAction === "all" || entry.action === filterAction;

    return matchesSearch && matchesFilter;
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-600 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-slate-800/50 border-b border-slate-600">
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-blue-400" />
            Historique des Trains
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Onglets */}
        <div className="flex border-b border-slate-600 bg-slate-800/30">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-blue-300 border-b-2 border-blue-400 bg-slate-700/50"
                : "text-slate-300 hover:text-white hover:bg-slate-700/30"
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Historique détaillé
          </button>
          <button
            onClick={() => setActiveTab("ranking")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "ranking"
                ? "text-blue-300 border-b-2 border-blue-400 bg-slate-700/50"
                : "text-slate-300 hover:text-white hover:bg-slate-700/30"
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Classement
          </button>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-300">Chargement...</p>
              </div>
            </div>
          ) : activeTab === "history" ? (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">Toutes les actions</option>
                    {Object.entries(actionLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Liste de l'historique */}
              {filteredHistory.length > 0 ? (
                <div className="space-y-3">
                  {filteredHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-4 bg-slate-800/60 rounded-lg border border-slate-600/50 hover:bg-slate-700/60 transition-colors"
                    >
                      {/* Icône de l'action */}
                      <div className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                        {actionIcons[entry.action] || (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium">
                          {formatHistoryEntry(entry)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {entry.trainInstance ? (
                              <span>
                                {entry.trainInstance.dayOfWeek} -{" "}
                                {entry.trainInstance.departureTime}
                              </span>
                            ) : entry.trainSlot ? (
                              <span>
                                {dayLabels[entry.trainSlot.day]} -{" "}
                                {entry.trainSlot.departureTime}
                              </span>
                            ) : (
                              <span>Train supprimé</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleString("fr-FR")}
                          </div>
                        </div>
                      </div>

                      {/* Badge action */}
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-700/50 border-slate-500 text-slate-300"
                      >
                        {actionLabels[entry.action] || entry.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-6xl mb-4">📅</div>
                  <div className="text-lg font-semibold">
                    {searchTerm || filterAction !== "all"
                      ? "Aucun résultat trouvé"
                      : "Aucun historique disponible"}
                  </div>
                  <div className="text-sm mt-2">
                    {searchTerm || filterAction !== "all"
                      ? "Essayez de modifier vos filtres"
                      : "Les actions sur les trains apparaîtront ici"}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Onglet Classement
            <div className="space-y-4">
              {ranking.length > 0 ? (
                ranking.map((conductor, index) => (
                  <div
                    key={conductor.targetId || conductor.pseudo}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      index < 3
                        ? "bg-gradient-to-r from-slate-700/80 to-slate-800/80 border-amber-500/50 shadow-lg"
                        : "bg-slate-800/60 border-slate-600/50"
                    } backdrop-blur-sm hover:bg-slate-700/70 transition-all`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position et badge */}
                      <div
                        className={`bg-gradient-to-r ${getRankColor(
                          index
                        )} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg`}
                      >
                        {getRankIcon(index)}
                      </div>

                      {/* Infos conducteur */}
                      <div>
                        <div className="font-bold text-white text-lg">
                          {conductor.pseudo}
                        </div>
                        <div className="text-sm text-slate-300">
                          {conductor.lastDate ? (
                            <>
                              Dernière fois:{" "}
                              {new Date(conductor.lastDate).toLocaleDateString(
                                "fr-FR"
                              )}
                              {conductor.lastTrain && (
                                <span className="ml-2">
                                  ({dayLabels[conductor.lastTrain.day]} -{" "}
                                  {conductor.lastTrain.departureTime})
                                </span>
                              )}
                            </>
                          ) : (
                            "Aucun historique"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nombre de trains */}
                    <Badge
                      variant="outline"
                      className={`font-bold text-lg px-3 py-1 ${
                        index < 3
                          ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
                          : "bg-blue-500/20 text-blue-300 border-blue-400/50"
                      }`}
                    >
                      {conductor.count} train{conductor.count > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-6xl mb-4">🏆</div>
                  <div className="text-lg font-semibold">
                    Aucun classement disponible
                  </div>
                  <div className="text-sm mt-2">
                    Les données apparaîtront une fois les trains assignés
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
