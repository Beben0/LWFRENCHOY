"use client";

import { TimeSlotSelector } from "@/components/forms/time-slot-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Shield, Train, User, Users, X } from "lucide-react";
import { useState } from "react";

interface Member {
  id: string;
  pseudo: string;
  specialty: string | null;
  allianceRole: "R5" | "R4" | "MEMBER";
  level: number;
}

interface TrainPassenger {
  id: string;
  passenger: Member;
  joinedAt: Date;
}

interface TrainSlot {
  id: string;
  day: string;
  departureTime: string;
  conductor: Member | null;
  passengers: TrainPassenger[];
}

interface NewTrainScheduleProps {
  trainSlots: TrainSlot[];
  members: Member[];
  currentUserId?: string;
  isAdmin?: boolean;
}

const dayLabels: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export function NewTrainSchedule({
  trainSlots,
  members,
  currentUserId,
  isAdmin = false,
}: NewTrainScheduleProps) {
  const [selectedTrain, setSelectedTrain] = useState<TrainSlot | null>(null);
  const [showConductorSelect, setShowConductorSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculer l'heure réelle de départ (4h après l'heure spécifiée)
  const calculateRealDepartureTime = (departureTime: string) => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const realHours = (hours + 4) % 24;
    return `${realHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  // Vérifier si la période d'inscription est encore ouverte
  const isRegistrationOpen = (departureTime: string) => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const departureDateTime = new Date();
    departureDateTime.setHours(hours + 4, minutes, 0, 0);
    return new Date() < departureDateTime;
  };

  // Temps restant pour s'inscrire
  const getTimeRemaining = (departureTime: string) => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const departureDateTime = new Date();
    departureDateTime.setHours(hours + 4, minutes, 0, 0);
    const now = new Date();
    const diff = departureDateTime.getTime() - now.getTime();

    if (diff <= 0) return "Fermé";

    const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hoursRemaining}h ${minutesRemaining}m`;
  };

  const handleAssignConductor = async (
    trainId: string,
    conductorId: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trains/${trainId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conductorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'assignation");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de l'assignation");
    } finally {
      setLoading(false);
      setShowConductorSelect(false);
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

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="space-y-6">
      {/* Explication du système */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Train className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-2">
                Comment fonctionne le système de trains :
              </p>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• Un conducteur par jour spécifie un créneau de départ</li>
                <li>• Le train part 4h après ce créneau</li>
                <li>
                  • Les autres membres ont 4h pour s'inscrire comme passagers
                </li>
                <li>• Une fois les 4h écoulées, les inscriptions se ferment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trains par jour */}
      <div className="space-y-4">
        {days.map((day) => {
          const train = trainSlots.find((t) => t.day === day);
          const isOpen = train ? isRegistrationOpen(train.departureTime) : true;
          const timeRemaining = train
            ? getTimeRemaining(train.departureTime)
            : "";

          return (
            <Card
              key={day}
              className={`${!isOpen && train ? "opacity-75" : ""}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{dayLabels[day]}</span>
                    {train && (
                      <Badge
                        variant={isOpen ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {isOpen ? `${timeRemaining} restant` : "Fermé"}
                      </Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTrain(
                          train || {
                            id: "",
                            day,
                            departureTime: "20:00",
                            conductor: null,
                            passengers: [],
                          }
                        );
                        setShowConductorSelect(true);
                      }}
                    >
                      {train ? "Modifier" : "Créer Train"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {train ? (
                  <div className="space-y-4">
                    {/* Informations du train */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Créneau spécifié
                        </p>
                        <p className="text-lg font-bold">
                          {train.departureTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Départ réel du train
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {calculateRealDepartureTime(train.departureTime)}
                        </p>
                      </div>
                    </div>

                    {/* Conducteur */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        Conducteur
                      </h4>
                      {train.conductor ? (
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          {getRoleIcon(train.conductor.allianceRole)}
                          <div>
                            <p className="font-medium">
                              {train.conductor.pseudo}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lvl {train.conductor.level} •{" "}
                              {train.conductor.specialty || "Non définie"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Aucun conducteur assigné
                        </p>
                      )}
                    </div>

                    {/* Note sur les passagers */}
                    <div className="text-center py-4 bg-muted/30 rounded-lg">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Les passagers sont choisis automatiquement par le jeu
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pas d'inscription manuelle nécessaire
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun train programmé pour ce jour
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de sélection du conducteur */}
      {showConductorSelect && selectedTrain && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Assigner un conducteur - {dayLabels[selectedTrain.day]}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConductorSelect(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              {/* Sélection de l'heure */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Créneau de départ :
                </label>
                <TimeSlotSelector
                  value={selectedTrain.departureTime}
                  onChange={(value: string) =>
                    setSelectedTrain({
                      ...selectedTrain,
                      departureTime: value,
                    })
                  }
                  compact={true}
                  showPopular={false}
                />
              </div>

              {/* Sélection du conducteur */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Conducteur :
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <div
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleAssignConductor(selectedTrain.id, "")}
                  >
                    <span>Aucun conducteur</span>
                  </div>
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                      onClick={() =>
                        handleAssignConductor(selectedTrain.id, member.id)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.allianceRole)}
                        <div>
                          <div className="font-medium">{member.pseudo}</div>
                          <div className="text-xs text-muted-foreground">
                            Lvl {member.level} •{" "}
                            {member.specialty || "Non définie"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Traitement en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
