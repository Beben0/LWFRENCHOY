"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  PlayCircle,
  Train,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  pseudo: string;
  level: number;
  specialty: string | null;
  allianceRole: string;
  status: string;
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

const STATUS_CONFIG = {
  SCHEDULED: {
    label: "Programmé",
    color: "bg-blue-500",
    icon: Calendar,
    textColor: "text-blue-600",
  },
  BOARDING: {
    label: "Embarquement",
    color: "bg-orange-500 animate-pulse",
    icon: PlayCircle,
    textColor: "text-orange-600",
  },
  DEPARTED: {
    label: "Parti",
    color: "bg-green-500",
    icon: CheckCircle,
    textColor: "text-green-600",
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500",
    icon: XCircle,
    textColor: "text-red-600",
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-gray-500",
    icon: CheckCircle,
    textColor: "text-gray-600",
  },
};

interface FutureTrainScheduleProps {
  currentUserId?: string;
  isAdmin?: boolean;
  members: Member[];
}

export function FutureTrainSchedule({
  currentUserId,
  isAdmin = false,
  members,
}: FutureTrainScheduleProps) {
  const [trains, setTrains] = useState<TrainInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysAhead, setDaysAhead] = useState(7);
  const [selectedTrain, setSelectedTrain] = useState<TrainInstance | null>(
    null
  );
  const [showConductorSelect, setShowConductorSelect] = useState(false);

  const loadTrains = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trains-v2?daysAhead=${daysAhead}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des trains");
      }

      const data: ApiResponse = await response.json();
      setTrains(data.trains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrains();
  }, [daysAhead]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "0min";

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAssignConductor = async (
    trainId: string,
    conductorId: string,
    newDepartureTime?: string
  ) => {
    try {
      const response = await fetch("/api/trains-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_conductor",
          trainId,
          conductorId,
          departureTime: newDepartureTime,
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
    }
  };

  const groupTrainsByDate = (trains: TrainInstance[]) => {
    const groups: Record<string, TrainInstance[]> = {};

    trains.forEach((train) => {
      const date = new Date(train.date).toLocaleDateString("fr-FR");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(train);
    });

    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Train className="w-6 h-6 animate-spin mr-2" />
            <span>Chargement des trains...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Erreur: {error}</span>
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

  const groupedTrains = groupTrainsByDate(trains);
  const sortedDates = Object.keys(groupedTrains).sort(
    (a, b) =>
      new Date(a.split("/").reverse().join("-")).getTime() -
      new Date(b.split("/").reverse().join("-")).getTime()
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Train className="w-6 h-6" />
              <Translate>Planning des Trains - Nouveau Système</Translate>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  <Translate>Jours à afficher:</Translate>
                </label>
                <select
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(Number(e.target.value))}
                  className="border border-border rounded px-2 py-1 text-sm bg-background"
                >
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </div>
              <Badge variant="outline">
                {trains.length} <Translate>trains</Translate>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              ✨{" "}
              <strong>
                <Translate>Nouveau système automatique :</Translate>
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <Translate>
                  Trains générés automatiquement chaque jour
                </Translate>
              </li>
              <li>
                <Translate>Planning futur sur</Translate> {daysAhead}{" "}
                <Translate>jours</Translate>
              </li>
              <li>
                <Translate>
                  Statuts en temps réel (Programmé → Embarquement → Parti)
                </Translate>
              </li>
              <li>
                <Translate>Historique automatique des trains passés</Translate>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Liste des trains groupés par date */}
      <div className="space-y-4">
        {sortedDates.map((date) => {
          const dayTrains = groupedTrains[date];
          const train = dayTrains[0]; // Un seul train par jour

          // Recalcule en local pour éviter les décalages de fuseau horaire (le backend envoie en UTC)
          const localIsToday = (() => {
            const d = new Date(train.date);
            const nowLocal = new Date();
            return (
              d.getFullYear() === nowLocal.getFullYear() &&
              d.getMonth() === nowLocal.getMonth() &&
              d.getDate() === nowLocal.getDate()
            );
          })();

          const statusConfig =
            STATUS_CONFIG[train.status as keyof typeof STATUS_CONFIG];
          const StatusIcon = statusConfig.icon;

          return (
            <Card
              key={date}
              className={`transition-all duration-200 ${
                localIsToday ? "ring-2 ring-orange-500 bg-orange-50/50" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {new Date(train.date).getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {new Date(train.date).toLocaleDateString("fr-FR", {
                          month: "short",
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                        {train.dayOfWeek}
                        <span className="text-sm text-muted-foreground font-normal">
                          {new Date(train.date).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        {localIsToday && (
                          <Badge className="ml-2 bg-orange-500">
                            <Translate>Aujourd'hui</Translate>
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={`${statusConfig.color} text-white border-none`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <span>{date}</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <Button
                      size="sm"
                      variant={train.conductor ? "secondary" : "default"}
                      onClick={() => {
                        setSelectedTrain(train);
                        setShowConductorSelect(true);
                      }}
                      disabled={train.metadata.isPast}
                    >
                      {train.conductor ? (
                        <Translate>Modifier</Translate>
                      ) : (
                        <Translate>Assigner</Translate>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Horaires */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      <Translate>Horaires</Translate>
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>
                          <Translate>Inscription:</Translate>{" "}
                          {train.departureTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4 text-green-500" />
                        <span>
                          <Translate>Départ:</Translate>{" "}
                          {train.realDepartureTime}
                        </span>
                      </div>
                      {train.metadata.timeUntilDeparture > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <Translate>Dans</Translate>{" "}
                          {formatTimeRemaining(
                            train.metadata.timeUntilDeparture
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conducteur */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      <Translate>Conducteur</Translate>
                    </h4>
                    {train.conductor ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div className="font-medium">
                            {train.conductor.pseudo}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <Translate>Lvl</Translate> {train.conductor.level} •{" "}
                            <Translate from="auto">
                              {train.conductor.specialty || "Aucune"}
                            </Translate>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        <Translate>Aucun conducteur assigné</Translate>
                      </div>
                    )}
                  </div>

                  {/* Passagers */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <Translate>Passagers</Translate> (
                      {train.metadata.passengerCount})
                    </h4>
                    {train.passengers.length > 0 ? (
                      <div className="space-y-1">
                        {train.passengers.slice(0, 3).map((passenger) => (
                          <div key={passenger.id} className="text-xs">
                            {passenger.passenger.pseudo}
                          </div>
                        ))}
                        {train.passengers.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{train.passengers.length - 3}{" "}
                            <Translate>autres...</Translate>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        <Translate>Aucun passager inscrit</Translate>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barre de statut pour embarquement */}
                {train.status === "BOARDING" && (
                  <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700">
                      <PlayCircle className="w-5 h-5 animate-pulse" />
                      <span className="font-medium">
                        <Translate>Embarquement en cours !</Translate>
                      </span>
                    </div>
                    <div className="text-sm text-orange-600 mt-1">
                      <Translate>Plus que</Translate>{" "}
                      {formatTimeRemaining(
                        train.metadata.timeUntilRealDeparture
                      )}{" "}
                      avant le départ
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {trains.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Train className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">Aucun train prévu</h3>
            <p className="text-muted-foreground">
              Aucun train n'est programmé pour les {daysAhead} prochains jours
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de sélection conducteur */}
      {showConductorSelect && selectedTrain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                Assigner conducteur - {selectedTrain.dayOfWeek}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() =>
                        handleAssignConductor(selectedTrain.id, member.id)
                      }
                      className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{member.pseudo}</div>
                      <div className="text-sm text-muted-foreground">
                        <Translate>Lvl</Translate> {member.level} •{" "}
                        {member.specialty || "Aucune"} • {member.allianceRole}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConductorSelect(false);
                      setSelectedTrain(null);
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
