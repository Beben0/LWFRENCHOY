"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Crown,
  PlayCircle,
  Shield,
  Train,
  User,
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

const dayLabels: Record<string, string> = {
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
    color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    icon: Calendar,
  },
  BOARDING: {
    label: "Embarquement",
    color:
      "bg-orange-500/20 text-orange-400 border-orange-500/50 animate-pulse",
    icon: PlayCircle,
  },
  DEPARTED: {
    label: "Parti",
    color: "bg-green-500/20 text-green-400 border-green-500/50",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500/20 text-red-400 border-red-500/50",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/50",
    icon: CheckCircle,
  },
};

interface EnhancedTrainScheduleProps {
  currentUserId?: string;
  isAdmin?: boolean;
  members: Member[];
}

export function EnhancedTrainSchedule({
  currentUserId,
  isAdmin = false,
  members,
}: EnhancedTrainScheduleProps) {
  const [trains, setTrains] = useState<TrainInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainInstance | null>(
    null
  );
  const [showConductorSelect, setShowConductorSelect] = useState(false);
  const [daysToShow] = useState(7); // Afficher 7 jours comme avant

  const loadTrains = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trains-v2?daysAhead=${daysToShow}`);

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
  }, [daysToShow]);

  const handleAssignConductor = async (
    trainId: string,
    conductorId: string
  ) => {
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
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "R5":
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case "R4":
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return <User className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getSpecialtyColor = (specialty: string | null) => {
    switch (specialty) {
      case "Sniper":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "Tank":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "Farmer":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "Defense":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Terminé";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusText = (train: TrainInstance): string => {
    if (train.status === "BOARDING") {
      return `Embarquement ! Plus que ${formatTimeRemaining(
        train.metadata.timeUntilRealDeparture
      )}`;
    }
    if (train.status === "DEPARTED") {
      return "Train parti";
    }
    if (train.status === "SCHEDULED" && train.metadata.timeUntilDeparture > 0) {
      return `Inscriptions ouvertes (départ dans ${formatTimeRemaining(
        train.metadata.timeUntilDeparture
      )})`;
    }
    return (
      STATUS_CONFIG[train.status as keyof typeof STATUS_CONFIG]?.label ||
      train.status
    );
  };

  // Organiser les trains par jour
  const organizeTrainsByDay = () => {
    const organized: Record<string, TrainInstance> = {};

    trains.forEach((train) => {
      organized[train.dayOfWeek] = train;
    });

    return organized;
  };

  const trainsByDay = organizeTrainsByDay();
  const weekDays = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Train className="w-6 h-6 animate-spin mr-2" />
            <span>Chargement du planning...</span>
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

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/50 rounded" />
              <span>Programmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/50 rounded animate-pulse" />
              <span>Embarquement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded" />
              <span>Parti</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>Leader (R5)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Officier (R4)</span>
            </div>
            <div className="text-xs text-muted-foreground">
              ✨ Système automatique : trains générés chaque jour, statuts en
              temps réel
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Train className="w-5 h-5" />
            Planning Automatique ({trains.length} trains)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="font-semibold text-sm text-muted-foreground">
                  Date
                </div>
                {weekDays.map((day) => (
                  <div key={day} className="font-semibold text-sm text-center">
                    {dayLabels[day]}
                  </div>
                ))}
              </div>

              {/* Single row for this week */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="flex items-center font-mono text-sm font-medium">
                  <Calendar className="w-4 h-4 mr-1" />
                  Semaine
                </div>

                {weekDays.map((day) => {
                  const train = trainsByDay[day];

                  if (!train) {
                    return (
                      <div
                        key={day}
                        className="min-h-[120px] p-2 rounded border-2 border-dashed border-muted bg-muted/20 flex items-center justify-center"
                      >
                        <span className="text-xs text-muted-foreground">
                          Aucun train
                        </span>
                      </div>
                    );
                  }

                  const statusConfig =
                    STATUS_CONFIG[train.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Calendar;

                  return (
                    <div
                      key={day}
                      className={`
                        min-h-[120px] p-3 rounded border-2 cursor-pointer transition-all
                        ${statusConfig?.color || "bg-muted/20 border-muted"}
                        ${
                          train.metadata.isToday ? "ring-2 ring-orange-500" : ""
                        }
                        hover:shadow-lg
                      `}
                      onClick={() => {
                        if (isAdmin && !train.metadata.isPast) {
                          setSelectedTrain(train);
                          setShowConductorSelect(true);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        {/* Date et statut */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium">
                            {new Date(train.date).getDate()}/
                            {new Date(train.date).getMonth() + 1}
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {train.metadata.isToday && (
                              <Badge className="text-xs bg-orange-500">
                                Aujourd'hui
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Horaires */}
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Inscription: {train.departureTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Train className="w-3 h-3" />
                            <span>Départ: {train.realDepartureTime}</span>
                          </div>
                        </div>

                        {/* Conducteur */}
                        <div className="space-y-1">
                          {train.conductor ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                {getRoleIcon(train.conductor.allianceRole)}
                                <span className="font-medium truncate">
                                  {train.conductor.pseudo}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Lvl {train.conductor.level} •{" "}
                                {train.conductor.specialty || "Aucune"}
                              </div>
                              {train.conductor.specialty && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getSpecialtyColor(
                                    train.conductor.specialty
                                  )}`}
                                >
                                  {train.conductor.specialty}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
                              <User className="w-3 h-3" />
                              <span>Aucun conducteur</span>
                            </div>
                          )}
                        </div>

                        {/* Passagers */}
                        <div className="text-xs">
                          <span className="font-medium">
                            {train.metadata.passengerCount} passagers
                          </span>
                          {train.passengers.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {train.passengers.slice(0, 2).map((passenger) => (
                                <div key={passenger.id} className="truncate">
                                  {passenger.passenger.pseudo}
                                </div>
                              ))}
                              {train.passengers.length > 2 && (
                                <div className="text-muted-foreground">
                                  +{train.passengers.length - 2} autres...
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Statut spécial */}
                        <div className="text-xs font-medium">
                          {getStatusText(train)}
                        </div>

                        {isAdmin && !train.metadata.isPast && (
                          <div className="pt-1 border-t border-current/20">
                            <div className="text-xs text-center opacity-70">
                              Cliquer pour{" "}
                              {train.conductor ? "modifier" : "assigner"}
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

      {/* Modal de sélection conducteur */}
      {showConductorSelect && selectedTrain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                Assigner conducteur - {selectedTrain.dayOfWeek}{" "}
                {new Date(selectedTrain.date).getDate()}/
                {new Date(selectedTrain.date).getMonth() + 1}
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
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.allianceRole)}
                        <div>
                          <div className="font-medium">{member.pseudo}</div>
                          <div className="text-sm text-muted-foreground">
                            Lvl {member.level} • {member.specialty || "Aucune"}{" "}
                            • {member.allianceRole}
                          </div>
                        </div>
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
