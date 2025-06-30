"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Crown, Plus, Shield, User, X } from "lucide-react";
import { useState } from "react";

interface Member {
  id: string;
  pseudo: string;
  specialty: string | null;
  allianceRole: string;
  level: number;
}

interface SlotData {
  id: string | null;
  member: Member | null;
  isEmpty: boolean;
}

interface TrainScheduleProps {
  schedule: Record<string, Record<string, SlotData>>;
  members: Member[];
  days: string[];
  timeSlots: string[];
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

export function TrainSchedule({
  schedule,
  members,
  days,
  timeSlots,
}: TrainScheduleProps) {
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
  } | null>(null);
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSlotClick = (day: string, time: string) => {
    setSelectedSlot({ day, time });
    setShowMemberSelect(true);
  };

  const handleAssignMember = async (memberId: string | null) => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      const currentSlot = schedule[selectedSlot.day][selectedSlot.time];

      // Si le slot existe déjà, on le met à jour
      if (currentSlot.id) {
        const response = await fetch(`/api/trains/${currentSlot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day: selectedSlot.day,
            timeSlot: selectedSlot.time,
            memberId: memberId,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour");
        }
      } else {
        // Sinon on crée un nouveau slot
        const response = await fetch("/api/trains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day: selectedSlot.day,
            timeSlot: selectedSlot.time,
            memberId: memberId,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la création");
        }
      }

      // Recharger la page pour refléter les changements
      window.location.reload();
    } catch (error) {
      console.error("Error assigning member:", error);
      alert("Erreur lors de l'assignation. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setShowMemberSelect(false);
      setSelectedSlot(null);
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

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded" />
              <span>Assigné</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded" />
              <span>Libre</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>Leader (R5)</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span>Officier (R4)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Planning Hebdomadaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="font-semibold text-sm text-muted-foreground">
                  Heure
                </div>
                {days.map((day) => (
                  <div key={day} className="font-semibold text-sm text-center">
                    {dayLabels[day]}
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="flex items-center font-mono text-sm font-medium">
                    {time}
                  </div>

                  {days.map((day) => {
                    const slot = schedule[day][time];
                    const isEmpty = slot.isEmpty;

                    return (
                      <div
                        key={`${day}-${time}`}
                        className={`
                          min-h-[60px] p-2 rounded border-2 cursor-pointer transition-colors
                          ${
                            isEmpty
                              ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                              : "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                          }
                        `}
                        onClick={() => handleSlotClick(day, time)}
                      >
                        {slot.member ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              {getRoleIcon(slot.member.allianceRole)}
                              <span className="text-xs font-medium truncate">
                                {slot.member.pseudo}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Lvl {slot.member.level}
                            </div>
                            {slot.member.specialty && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getSpecialtyColor(
                                  slot.member.specialty
                                )}`}
                              >
                                {slot.member.specialty}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Selection Modal */}
      {showMemberSelect && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Assigner un conducteur</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMemberSelect(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto">
              <div className="text-sm text-muted-foreground">
                Créneau: {dayLabels[selectedSlot.day]} à {selectedSlot.time}
              </div>

              {/* Current Assignment */}
              {schedule[selectedSlot.day][selectedSlot.time].member && (
                <div className="p-3 bg-muted rounded border">
                  <div className="text-sm font-medium mb-2">
                    Conducteur actuel:
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(
                        schedule[selectedSlot.day][selectedSlot.time].member!
                          .allianceRole
                      )}
                      <span>
                        {
                          schedule[selectedSlot.day][selectedSlot.time].member!
                            .pseudo
                        }
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignMember(null)}
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              )}

              {/* Available Members */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Membres disponibles:</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleAssignMember(member.id)}
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
                      <Plus className="w-4 h-4 text-muted-foreground" />
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
              <span>Mise à jour en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
