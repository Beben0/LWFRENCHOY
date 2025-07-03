"use client";

import { TimeSlotSelector } from "@/components/forms/time-slot-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Crown,
  History,
  PlayCircle,
  Search,
  Shield,
  Train,
  User,
  UserMinus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { TrainHistory } from "./train-history";

interface Member {
  id: string;
  pseudo: string;
  specialty: string | null;
  allianceRole: string;
  level: number;
  status: "ACTIVE" | "INACTIVE";
}

interface TrainInstance {
  id: string;
  date: string;
  dayOfWeek: string;
  departureTime: string;
  realDepartureTime: string;
  status: string;
  conductor?: Member;
  passengers: Array<{
    id: string;
    passenger: Member;
    joinedAt: string;
  }>;
  metadata: {
    isToday: boolean;
    isPast: boolean;
    canRegister: boolean;
    isBoarding: boolean;
    timeUntilDeparture: number;
    timeUntilRealDeparture: number;
    passengerCount: number;
  };
}

interface ApiResponse {
  trains: TrainInstance[];
  metadata: {
    total: number;
    daysAhead: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
}

interface ConductorHistory {
  pseudo: string;
  count: number;
  lastDate: string;
}

interface GraphicalTrainScheduleProps {
  trainSlots: any[]; // Maintenu pour compatibilité mais non utilisé
  members: Member[];
  currentUserId?: string;
  isAdmin?: boolean;
}

const dayLabels: { [key: string]: string } = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

const STATUS_CONFIG = {
  SCHEDULED: {
    label: "Programmé",
    color: "bg-blue-500/20 text-blue-300",
    icon: Calendar,
  },
  BOARDING: {
    label: "Embarquement",
    color: "bg-orange-500/20 text-orange-300 animate-pulse",
    icon: PlayCircle,
  },
  DEPARTED: {
    label: "Parti",
    color: "bg-green-500/20 text-green-300",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500/20 text-red-300",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-gray-500/20 text-gray-300",
    icon: CheckCircle,
  },
};

// Wrapper client-only pour éviter l'hydratation
function ClientOnlyTrainSchedule(props: GraphicalTrainScheduleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Train className="w-6 h-6 animate-spin mr-2" />
            <span>
              <Translate>Chargement du planning…</Translate>
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <TrainScheduleContent {...props} />;
}

// Composant client pour éviter les hydration errors
function TrainDateInfo({ train }: { train: TrainInstance }) {
  const [mounted, setMounted] = useState(false);
  const [dateInfo, setDateInfo] = useState({
    dayNum: "...",
    month: "...",
    isToday: false,
  });

  useEffect(() => {
    setMounted(true);

    // Calculer côté client pour éviter hydration mismatch
    const dateStr = train.date;
    const datePart = dateStr.includes("T")
      ? dateStr.split("T")[0]
      : dateStr.split(" ")[0];
    const dateParts = datePart.split("-");
    const day = parseInt(dateParts[2]);

    const months = [
      "JAN",
      "FÉV",
      "MAR",
      "AVR",
      "MAI",
      "JUN",
      "JUL",
      "AOÛ",
      "SEP",
      "OCT",
      "NOV",
      "DÉC",
    ];
    const month = months[parseInt(dateParts[1]) - 1];

    const now = getParisDate(new Date());
    const todayStr =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");

    setDateInfo({
      dayNum: day.toString(),
      month: month,
      isToday: todayStr === datePart,
    });
  }, [train.date]);

  if (!mounted) return null;

  return (
    <div>
      <div
        className={`text-sm ${
          dateInfo.isToday ? "text-orange-400 font-semibold" : "text-gray-400"
        }`}
      >
        <Translate>
          {dateInfo.dayNum} {dateInfo.month}
        </Translate>
      </div>
    </div>
  );
}

// Composant séparé pour éviter les hydration errors
function TimeDisplay({ train }: { train: TrainInstance }) {
  const [mounted, setMounted] = useState(false);
  const [timeData, setTimeData] = useState({
    isPast: false,
    timeUntilDeparture: 0,
    timeText: "Chargement...",
  });

  useEffect(() => {
    setMounted(true);

    // Calculer côté client pour éviter hydration mismatch
    const calculateTime = () => {
      const now = getParisDate(new Date());
      const trainDate = getParisDate(train.date);

      const [hours, minutes] = train.departureTime.split(":").map(Number);
      const departureDateTime = new Date(trainDate);
      departureDateTime.setHours(hours, minutes, 0, 0);

      const isPast = departureDateTime < now;
      const timeUntilDeparture = isPast
        ? 0
        : departureDateTime.getTime() - now.getTime();

      const finalTimeText = getStatusText(
        isPast,
        timeUntilDeparture,
        train.status
      );

      setTimeData({
        isPast,
        timeUntilDeparture,
        timeText: finalTimeText,
      });
    };

    calculateTime();
    // Mettre à jour toutes les minutes
    const interval = setInterval(calculateTime, 60000);

    return () => clearInterval(interval);
  }, [train.date, train.departureTime, train.status]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Maintenant";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  };

  const getStatusText = (
    isPast: boolean,
    timeUntilDeparture: number,
    status: string
  ): string => {
    if (status === "BOARDING") {
      return "Embarquement !";
    }
    if (status === "DEPARTED") {
      return "Train parti";
    }
    if (isPast) {
      return "Train parti";
    }
    if (status === "SCHEDULED") {
      if (timeUntilDeparture > 0) {
        return formatTimeRemaining(timeUntilDeparture);
      }
      return "Bientôt";
    }

    const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    return statusConfig?.label || status;
  };

  if (!mounted) {
    return (
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-300">
          <Calendar className="w-3 h-3" />
          <Translate>Chargement…</Translate>
        </div>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[train.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || Calendar;

  return (
    <div className="space-y-1">
      <div
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
          statusConfig?.color || "bg-gray-500/20 text-gray-300"
        }`}
      >
        <StatusIcon className="w-3 h-3" />
        <Translate>{timeData.timeText}</Translate>
      </div>
    </div>
  );
}

function TodayBadge({ train }: { train: TrainInstance }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recalcule en local pour éviter les décalages
  const isToday = (() => {
    const d = getParisDate(new Date(train.date));
    const n = getParisDate(new Date());
    return (
      d.getFullYear() === n.getFullYear() &&
      d.getMonth() === n.getMonth() &&
      d.getDate() === n.getDate()
    );
  })();

  const isDeparted = train.status === "DEPARTED";

  if (!mounted || !isToday) return null;

  const badgeClass = isDeparted
    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
    : "bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse";

  const badgeText = isDeparted ? "🕐 AUJOURD'HUI (PARTI)" : "🔥 AUJOURD'HUI";

  return (
    <div className="absolute -top-1 -right-1 z-10">
      <div className={badgeClass}>
        <Translate>{badgeText}</Translate>
      </div>
    </div>
  );
}

// Composant pour une ligne de train avec gestion d'état client
function TrainRow({
  day,
  train,
  isAdmin,
  actionLoading,
  setSelectedTrain,
  setShowConductorSelect,
}: {
  day: string;
  train: TrainInstance | null;
  isAdmin: boolean;
  actionLoading: boolean;
  setSelectedTrain: (train: TrainInstance) => void;
  setShowConductorSelect: (show: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [borderClass, setBorderClass] = useState(
    "bg-gray-500/10 border-l-gray-500"
  );

  useEffect(() => {
    setMounted(true);

    if (train) {
      // Recalcule en local pour éviter les décalages
      const isToday = (() => {
        const d = getParisDate(new Date(train.date));
        const n = getParisDate(new Date());
        return (
          d.getFullYear() === n.getFullYear() &&
          d.getMonth() === n.getMonth() &&
          d.getDate() === n.getDate()
        );
      })();

      if (isToday) {
        setBorderClass("bg-orange-500/10 border-l-orange-500");
      } else if (train?.conductor) {
        setBorderClass("bg-green-500/10 border-l-green-500");
      } else {
        setBorderClass("bg-yellow-500/10 border-l-yellow-500");
      }
    } else {
      setBorderClass("bg-gray-500/10 border-l-gray-500");
    }
  }, [train]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "R5":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "R4":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      className={`relative border-l-4 hover:bg-gray-800/30 transition-colors ${borderClass}`}
    >
      {/* Badge AUJOURD'HUI flottant */}
      {train &&
        (() => {
          const d = getParisDate(new Date(train.date));
          const n = getParisDate(new Date());
          return (
            d.getFullYear() === n.getFullYear() &&
            d.getMonth() === n.getMonth() &&
            d.getDate() === n.getDate()
          );
        })() && <TodayBadge train={train} />}

      {/* Layout responsive : mobile stack, desktop inline */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Jour, date et horaire - groupés sur mobile */}
        <div className="flex justify-between items-center sm:justify-start sm:gap-6">
          {/* Jour et date */}
          <div className="flex-shrink-0">
            <div className="font-bold text-white">
              <Translate>{dayLabels[day]}</Translate>
            </div>
            {train && <TrainDateInfo train={train} />}
          </div>

          {/* Horaire */}
          <div className="text-center sm:text-left">
            {train ? (
              <>
                <div className="text-xl sm:text-2xl font-bold text-orange-400">
                  {train.departureTime}
                </div>
                <div className="text-xs text-gray-400">
                  → {train.realDepartureTime}
                </div>
              </>
            ) : (
              <div className="text-gray-500">
                <Translate>—</Translate>
              </div>
            )}
          </div>
        </div>

        {/* Temps restant et statut */}
        <div className="sm:w-40 sm:flex-shrink-0">
          {train && <TimeDisplay train={train} />}
        </div>

        {/* Conducteur - mobile full width, desktop flex */}
        <div className="flex-1 min-w-0">
          {train?.conductor ? (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getRoleIcon(train.conductor.allianceRole)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white break-words">
                  {train.conductor.pseudo}
                </div>
                <div className="text-sm text-gray-400 flex flex-wrap items-center gap-2">
                  <span>Niveau {train.conductor.level}</span>
                  {train.conductor.specialty && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-400/20 text-blue-300 rounded">
                        {train.conductor.specialty}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : train ? (
            <div className="flex items-center gap-2 text-orange-300">
              <span className="text-lg">⚠️</span>
              <span className="text-sm">
                <Translate>Conducteur requis</Translate>
              </span>
            </div>
          ) : (
            <div className="text-gray-500 italic text-sm">
              Aucun train programmé
            </div>
          )}
        </div>

        {/* Actions - mobile full width button */}
        <div className="sm:w-24 sm:flex-shrink-0 sm:text-right">
          {isAdmin && train && !train.metadata.isPast && (
            <Button
              size="sm"
              variant={train.conductor ? "secondary" : "default"}
              className="text-xs w-full sm:w-auto"
              onClick={() => {
                setSelectedTrain(train);
                setShowConductorSelect(true);
              }}
              disabled={actionLoading}
            >
              {train.conductor ? (
                <Translate>Modifier</Translate>
              ) : (
                <Translate>Assigner</Translate>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Utilitaire pour obtenir une date en timezone Paris
function getParisDate(date: string | Date) {
  // Si déjà un objet Date, convertit en string ISO
  const iso = typeof date === "string" ? date : date.toISOString();
  // Force parsing en Europe/Paris
  const parisString = new Date(iso).toLocaleString("en-US", {
    timeZone: "Europe/Paris",
  });
  return new Date(parisString);
}

// Contenu principal du composant train
function TrainScheduleContent({
  trainSlots, // Non utilisé maintenant
  members,
  currentUserId,
  isAdmin = false,
}: GraphicalTrainScheduleProps) {
  const [trains, setTrains] = useState<TrainInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainInstance | null>(
    null
  );
  const [showConductorSelect, setShowConductorSelect] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conductorHistory, setConductorHistory] = useState<ConductorHistory[]>(
    []
  );
  const [daysAhead, setDaysAhead] = useState(7); // Nouveau state pour la période

  // Charger les trains depuis l'API trains-v2
  const loadTrains = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trains-v2?daysAhead=${daysAhead}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des trains");
      }

      const data: ApiResponse = await response.json();
      setTrains(data.trains);

      // Générer l'historique des conducteurs à partir des trains
      generateConductorHistory(data.trains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrains();
  }, [daysAhead]); // Recharger quand la période change

  // Générer l'historique des conducteurs
  const generateConductorHistory = (trainList: TrainInstance[]) => {
    const history: { [key: string]: ConductorHistory } = {};

    trainList.forEach((train) => {
      if (train.conductor) {
        const pseudo = train.conductor.pseudo;
        if (!history[pseudo]) {
          history[pseudo] = {
            pseudo,
            count: 0,
            lastDate: "",
          };
        }
        history[pseudo].count++;
        // Gérer les dates PostgreSQL et ISO
        const dateStr = train.date;
        const datePart = dateStr.includes("T")
          ? dateStr.split("T")[0]
          : dateStr.split(" ")[0];
        history[pseudo].lastDate = datePart;
      }
    });

    setConductorHistory(
      Object.values(history).sort((a, b) => b.count - a.count)
    );
  };

  // Filtrer les membres par pseudo
  const filteredMembers = members.filter((member) =>
    member.pseudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignConductor = async (
    trainId: string,
    conductorId: string
  ) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/trains-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_conductor",
          trainId,
          conductorId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'assignation");
      }

      await loadTrains(); // Recharger la liste
      setShowConductorSelect(false);
      setSelectedTrain(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    if (selectedTrain) {
      setSelectedTrain({
        ...selectedTrain,
        departureTime: newTime,
        realDepartureTime: calculateRealDepartureTime(newTime),
      });
    }
  };

  const calculateRealDepartureTime = (departureTime: string) => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const realHours = (hours + 4) % 24;
    return `${realHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleValidateChanges = async () => {
    if (!selectedTrain) return;

    setActionLoading(true);
    try {
      // Si un conducteur est sélectionné ET a changé, on fait l'assignation
      const selectedConductorId = selectedTrain.conductor?.id || "";
      const originalConductorId =
        trains.find((t) => t.id === selectedTrain.id)?.conductor?.id || "";

      if (selectedConductorId !== originalConductorId) {
        // Assignation de conducteur (peut inclure changement d'horaire)
        const response = await fetch("/api/trains-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "assign_conductor",
            trainId: selectedTrain.id,
            conductorId: selectedConductorId,
            departureTime: selectedTrain.departureTime, // Inclure l'horaire au cas où
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de l'assignation");
        }
      } else {
        // Seulement changement d'horaire
        const response = await fetch("/api/trains-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "modify_time",
            trainId: selectedTrain.id,
            departureTime: selectedTrain.departureTime,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la modification");
        }
      }

      await loadTrains();
      setShowConductorSelect(false);
      setSelectedTrain(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "R5":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "R4":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Train className="w-6 h-6 animate-spin mr-2" />
            <span>
              <Translate>Chargement du planning…</Translate>
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            onClick={loadTrains}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec historique */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Calendar className="w-6 h-6" />
                <Translate>Planification Automatique des Trains</Translate>
              </CardTitle>
              <p className="text-sm text-gray-400 mt-2">
                🤖 <Translate>Trains générés automatiquement</Translate> •{" "}
                <Translate>Statuts en temps réel</Translate> • {trains.length}{" "}
                <Translate>trains prévus</Translate>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Sélecteur de période amélioré */}
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                  <Translate>Afficher</Translate>
                </label>
                <select
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(Number(e.target.value))}
                  className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                >
                  <option value={7}>
                    <Translate>7 days</Translate>
                  </option>
                  <option value={14}>
                    <Translate>14 days</Translate>
                  </option>
                  <option value={21}>
                    <Translate>3 weeks</Translate>
                  </option>
                  <option value={30}>
                    <Translate>1 month</Translate>
                  </option>
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">
                  <Translate>Historique</Translate>
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste chronologique de tous les trains */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <Translate>Tous les trains</Translate> ({trains.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {trains.length > 0 ? (
              trains.map((train) => (
                <div
                  key={train.id}
                  className={`relative border-l-4 hover:bg-gray-800/30 transition-colors ${
                    train &&
                    (() => {
                      const d = getParisDate(new Date(train.date));
                      const n = getParisDate(new Date());
                      return (
                        d.getFullYear() === n.getFullYear() &&
                        d.getMonth() === n.getMonth() &&
                        d.getDate() === n.getDate()
                      );
                    })()
                      ? "bg-orange-500/10 border-l-orange-500"
                      : train?.conductor
                      ? "bg-green-500/10 border-l-green-500"
                      : "bg-yellow-500/10 border-l-yellow-500"
                  }`}
                >
                  {/* Badge AUJOURD'HUI flottant */}
                  {train &&
                    (() => {
                      const d = getParisDate(new Date(train.date));
                      const n = getParisDate(new Date());
                      return (
                        d.getFullYear() === n.getFullYear() &&
                        d.getMonth() === n.getMonth() &&
                        d.getDate() === n.getDate()
                      );
                    })() && <TodayBadge train={train} />}

                  {/* Layout responsive : mobile stack, desktop inline */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Date et jour */}
                    <div className="flex justify-between items-center sm:justify-start sm:gap-6">
                      <div className="flex-shrink-0">
                        <div className="font-bold text-white">
                          <Translate>{train.dayOfWeek}</Translate>
                        </div>
                        <TrainDateInfo train={train} />
                      </div>

                      {/* Horaire */}
                      <div className="text-center sm:text-left">
                        <div className="text-xl sm:text-2xl font-bold text-orange-400">
                          {train.departureTime}
                        </div>
                        <div className="text-xs text-gray-400">
                          → {train.realDepartureTime}
                        </div>
                      </div>
                    </div>

                    {/* Temps restant et statut */}
                    <div className="sm:w-40 sm:flex-shrink-0">
                      <TimeDisplay train={train} />
                    </div>

                    {/* Conducteur - mobile full width, desktop flex */}
                    <div className="flex-1 min-w-0">
                      {train?.conductor ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getRoleIcon(train.conductor.allianceRole)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white break-words">
                              {train.conductor.pseudo}
                            </div>
                            <div className="text-sm text-gray-400 flex flex-wrap items-center gap-2">
                              <span>Niveau {train.conductor.level}</span>
                              {train.conductor.specialty && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-xs px-2 py-0.5 bg-blue-400/20 text-blue-300 rounded">
                                    {train.conductor.specialty}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-300">
                          <span className="text-lg">⚠️</span>
                          <span className="text-sm">
                            <Translate>Conducteur requis</Translate>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions - mobile full width button */}
                    <div className="sm:w-24 sm:flex-shrink-0 sm:text-right">
                      {isAdmin && !train.metadata.isPast && (
                        <Button
                          size="sm"
                          variant={train.conductor ? "secondary" : "default"}
                          className="text-xs w-full sm:w-auto"
                          onClick={() => {
                            setSelectedTrain(train);
                            setShowConductorSelect(true);
                          }}
                          disabled={actionLoading}
                        >
                          {train.conductor ? (
                            <Translate>Modifier</Translate>
                          ) : (
                            <Translate>Assigner</Translate>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Train className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  <Translate>Aucun train programmé</Translate>
                </p>
                <p className="text-sm">
                  <Translate>
                    Les trains apparaîtront automatiquement selon la
                    planification
                  </Translate>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nouveau composant d'historique */}
      <TrainHistory show={showHistory} onClose={() => setShowHistory(false)} />

      {/* Modal de sélection du conducteur - Ancien système amélioré */}
      {showConductorSelect && selectedTrain && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500/30 shadow-2xl">
            {/* Header amélioré */}
            <CardHeader className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Train className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">
                      Gestion du Train -{" "}
                      <Translate>
                        {dayLabels[selectedTrain.dayOfWeek]}
                      </Translate>
                    </CardTitle>
                    <p className="text-sm text-gray-300 mt-1">
                      Créneau de départ : {selectedTrain.departureTime} →{" "}
                      {selectedTrain.realDepartureTime} (Soir)
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConductorSelect(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 max-h-[calc(90vh-12rem)] overflow-y-auto">
                {/* Section Configuration - Plus compact */}
                <div className="xl:col-span-1 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Train className="w-5 h-5 text-orange-400" />
                    Configuration
                  </h3>

                  {/* Sélecteur d'horaire */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">
                      Horaire de départ
                    </label>
                    <TimeSlotSelector
                      value={selectedTrain.departureTime}
                      onChange={handleTimeChange}
                    />
                    <div className="text-xs text-gray-400">
                      Départ réel: {selectedTrain.realDepartureTime} (4h après)
                    </div>
                  </div>

                  {/* Informations conducteur actuel */}
                  <div className="space-y-3">
                    {selectedTrain.conductor && (
                      <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getRoleIcon(selectedTrain.conductor.allianceRole)}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              Conducteur actuel
                            </div>
                            <div className="text-green-400 text-sm">
                              {selectedTrain.conductor.pseudo}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions principales */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleValidateChanges}
                        disabled={actionLoading}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3"
                      >
                        {actionLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <Translate>Validation…</Translate>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            {selectedTrain.conductor
                              ? " Valider les Modifications"
                              : " Valider l'Assignation"}
                          </div>
                        )}
                      </Button>
                    </div>

                    {selectedTrain.conductor && (
                      <Button
                        onClick={() =>
                          handleAssignConductor(selectedTrain.id, "")
                        }
                        disabled={actionLoading}
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 py-3"
                      >
                        <UserMinus className="w-5 h-5 mr-2" />
                        <Translate>Retirer le Conducteur</Translate>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Section Sélection du Conducteur - Plus large */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-400" />
                      Rechercher un Conducteur
                    </h3>
                    <div className="text-sm text-gray-400">
                      {filteredMembers.length} membre
                      {filteredMembers.length !== 1 ? "s" : ""} trouvé
                      {filteredMembers.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Barre de recherche améliorée */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par pseudo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                    />
                  </div>

                  {/* Liste des conducteurs avec scroll - Plus haute */}
                  <div
                    className="space-y-2 overflow-y-auto custom-scrollbar"
                    style={{ maxHeight: "calc(90vh - 20rem)" }}
                  >
                    {filteredMembers
                      .sort((a, b) => {
                        // Prioriser les membres actifs
                        if (a.status === "ACTIVE" && b.status !== "ACTIVE")
                          return -1;
                        if (b.status === "ACTIVE" && a.status !== "ACTIVE")
                          return 1;
                        // Puis trier par historique (moins utilisés en premier)
                        const aHistory = conductorHistory.find(
                          (h) => h.pseudo === a.pseudo
                        );
                        const bHistory = conductorHistory.find(
                          (h) => h.pseudo === b.pseudo
                        );
                        const aCount = aHistory?.count || 0;
                        const bCount = bHistory?.count || 0;
                        return aCount - bCount;
                      })
                      .map((member) => {
                        const memberHistory = conductorHistory.find(
                          (h) => h.pseudo === member.pseudo
                        );
                        const isSelected =
                          selectedTrain.conductor?.id === member.id;

                        return (
                          <div
                            key={member.id}
                            className={`group p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/20"
                                : member.status === "ACTIVE"
                                ? "bg-gray-800/70 border-gray-600 hover:bg-gray-700/70 hover:border-gray-500"
                                : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50"
                            }`}
                            onClick={() =>
                              setSelectedTrain({
                                ...selectedTrain,
                                conductor: member,
                              })
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                  {getRoleIcon(member.allianceRole)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-bold text-xl ${
                                        isSelected
                                          ? "text-orange-400"
                                          : "text-white"
                                      }`}
                                    >
                                      {member.pseudo}
                                    </span>
                                    {member.status !== "ACTIVE" && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs text-yellow-500 border-yellow-500/50"
                                      >
                                        <Translate>Inactif</Translate>
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="text-sm text-gray-400">
                                      Niveau {member.level}
                                    </span>
                                    {member.specialty && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 border-blue-500/30"
                                      >
                                        {member.specialty}
                                      </Badge>
                                    )}
                                  </div>

                                  {memberHistory && (
                                    <div className="text-xs text-gray-500 mt-2">
                                      {memberHistory.count} train
                                      {memberHistory.count > 1 ? "s" : ""}{" "}
                                      effectué
                                      {memberHistory.count > 1 ? "s" : ""} •
                                      Dernier: {memberHistory.lastDate}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex-shrink-0 ml-4">
                                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Export principal
export function GraphicalTrainSchedule(props: GraphicalTrainScheduleProps) {
  return <ClientOnlyTrainSchedule {...props} />;
}
