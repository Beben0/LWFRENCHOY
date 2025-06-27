"use client";

import { TimeSlotSelector } from "@/components/forms/time-slot-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Check,
  Clock,
  Crown,
  History,
  Search,
  Shield,
  Train,
  User,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { TrainHistory } from "./train-history";

interface Member {
  id: string;
  pseudo: string;
  specialty: string | null;
  allianceRole: "R5" | "R4" | "MEMBER";
  level: number;
  status: "ACTIVE" | "INACTIVE";
}

interface TrainSlot {
  id: string;
  day: string;
  departureTime: string;
  conductor: Member | null;
  passengers: any[];
}

interface ConductorHistory {
  pseudo: string;
  count: number;
  lastDate: string;
}

interface GraphicalTrainScheduleProps {
  trainSlots: TrainSlot[];
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
};

const timeSlotLabels: { [key: string]: string } = {
  "08:00": "Matin",
  "12:00": "Midi",
  "16:00": "Après-midi",
  "20:00": "Soir",
};

export function GraphicalTrainSchedule({
  trainSlots,
  members,
  currentUserId,
  isAdmin = false,
}: GraphicalTrainScheduleProps) {
  const [selectedTrain, setSelectedTrain] = useState<TrainSlot | null>(null);
  const [showConductorSelect, setShowConductorSelect] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conductorHistory, setConductorHistory] = useState<ConductorHistory[]>(
    []
  );

  // Charger l'historique des conducteurs (ancien système, gardé pour compatibilité)
  useEffect(() => {
    const loadConductorHistory = () => {
      const history: { [key: string]: ConductorHistory } = {};

      trainSlots.forEach((slot) => {
        if (slot.conductor) {
          const pseudo = slot.conductor.pseudo;
          if (!history[pseudo]) {
            history[pseudo] = {
              pseudo,
              count: 0,
              lastDate: "",
            };
          }
          history[pseudo].count++;
          // On simule une date récente pour l'exemple
          history[pseudo].lastDate = new Date().toLocaleDateString("fr-FR");
        }
      });

      setConductorHistory(
        Object.values(history).sort((a, b) => b.count - a.count)
      );
    };

    loadConductorHistory();
  }, [trainSlots]);

  // Filtrer les membres par pseudo
  const filteredMembers = members.filter((member) =>
    member.pseudo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateRealDepartureTime = (departureTime: string) => {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const realHours = (hours + 4) % 24;
    return `${realHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const getNextSlotDate = (
    day: string,
    departureTime: string,
    forceNextWeek = false
  ) => {
    const now = new Date();
    const dayIndexes = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDayIndex = dayIndexes[day as keyof typeof dayIndexes];
    const currentDayIndex = now.getDay();

    // DEBUG: Ajouter des logs pour déboguer
    console.log("DEBUG - getNextSlotDate:", {
      day,
      departureTime,
      targetDayIndex,
      currentDayIndex,
      currentTime: now.toLocaleString("fr-FR"),
    });

    let daysUntilTarget;

    if (targetDayIndex === currentDayIndex && !forceNextWeek) {
      // C'est aujourd'hui, on l'affiche toujours
      daysUntilTarget = 0;

      console.log("DEBUG - C'est aujourd'hui:", {
        day,
        departureTime,
        showing: "today",
      });
    } else {
      // Pas aujourd'hui, calculer normalement
      daysUntilTarget = (targetDayIndex - currentDayIndex + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7; // Semaine prochaine si 0
    }

    if (forceNextWeek) {
      daysUntilTarget = daysUntilTarget === 0 ? 7 : daysUntilTarget + 7;
    }

    console.log("DEBUG - Final daysUntilTarget:", daysUntilTarget);

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntilTarget);
    const [hours, minutes] = departureTime.split(":").map(Number);
    targetDate.setHours(hours, minutes, 0, 0);

    console.log("DEBUG - Target date:", targetDate.toLocaleString("fr-FR"));

    return targetDate;
  };

  const getTimeRemaining = (day: string, departureTime: string) => {
    const now = new Date();
    const dayIndexes = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDayIndex = dayIndexes[day as keyof typeof dayIndexes];
    const currentDayIndex = now.getDay();

    // Si c'est aujourd'hui, vérifier directement l'heure
    if (targetDayIndex === currentDayIndex) {
      const [hours, minutes] = departureTime.split(":").map(Number);
      const trainTimeToday = new Date();
      trainTimeToday.setHours(hours, minutes, 0, 0);

      const diff = trainTimeToday.getTime() - now.getTime();
      if (diff <= 0) return "Fermé aujourd'hui";

      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hoursLeft > 0) {
        return `${hoursLeft}h ${minutesLeft}min`;
      } else {
        return `${minutesLeft}min`;
      }
    }

    // Calculer pour les jours suivants
    const nextSlotDate = getNextSlotDate(day, departureTime);
    const diffToNextSlot = nextSlotDate.getTime() - now.getTime();

    if (diffToNextSlot <= 0) return "Fermé";

    const daysLeft = Math.floor(diffToNextSlot / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor(
      (diffToNextSlot % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (daysLeft > 0) {
      return `${daysLeft}j ${hoursLeft}h`;
    } else {
      return `${hoursLeft}h`;
    }
  };

  const formatSlotDate = (day: string, departureTime: string = "20:00") => {
    const now = new Date();
    const targetDate = getNextSlotDate(day, departureTime);

    return {
      dayNum: targetDate.getDate(),
      month: targetDate
        .toLocaleDateString("fr-FR", { month: "short" })
        .toUpperCase(),
      isToday: targetDate.toDateString() === now.toDateString(),
    };
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
          conductorId: conductorId || null,
          day: selectedTrain?.day,
          departureTime: selectedTrain?.departureTime,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error("Error assigning conductor");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setShowConductorSelect(false);
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

  const getDayColor = (day: string, hasConductor: boolean) => {
    const colors = {
      monday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-blue-500/30 shadow-2xl shadow-blue-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
      tuesday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-green-500/30 shadow-2xl shadow-green-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
      wednesday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-orange-500/30 shadow-2xl shadow-orange-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
      thursday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-red-500/30 shadow-2xl shadow-red-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
      friday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-amber-500/30 shadow-2xl shadow-amber-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
      saturday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-purple-500/30 shadow-2xl shadow-purple-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
      sunday: hasConductor
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-pink-500/30 shadow-2xl shadow-pink-900/20"
        : "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg",
    };
    return (
      colors[day as keyof typeof colors] ||
      "bg-gradient-to-br from-secondary/50 via-muted to-secondary/80 border-border/50 shadow-lg"
    );
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
      {/* Header avec historique */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-6 h-6" />
                Planification des Trains
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2"></p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Historique
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Planning en tableau compact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planning de la semaine</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {days.map((day) => {
              const train = trainSlots.find((t) => t.day === day);
              const timeRemaining = train
                ? getTimeRemaining(day, train.departureTime)
                : "";
              const dateInfo = formatSlotDate(
                day,
                train?.departureTime || "20:00"
              );

              return (
                <div
                  key={day}
                  className={`relative flex items-center p-4 border-l-4 hover:bg-gray-800/30 transition-colors ${
                    dateInfo.isToday
                      ? "bg-orange-500/10 border-l-orange-500"
                      : !!train?.conductor
                      ? "bg-green-500/10 border-l-green-500"
                      : train
                      ? "bg-yellow-500/10 border-l-yellow-500"
                      : "bg-gray-500/10 border-l-gray-500"
                  }`}
                >
                  {/* Badge AUJOURD'HUI flottant */}
                  {dateInfo.isToday && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                        🔥 AUJOURD'HUI
                      </div>
                    </div>
                  )}

                  {/* Jour et date */}
                  <div className="w-32 flex-shrink-0">
                    <div className="font-bold text-white">{dayLabels[day]}</div>
                    <div className="text-sm text-gray-400">
                      {dateInfo.dayNum} {dateInfo.month}
                    </div>
                  </div>

                  {/* Horaire */}
                  <div className="w-28 flex-shrink-0 text-center">
                    {train ? (
                      <>
                        <div className="text-2xl font-bold text-orange-400">
                          {train.departureTime}
                        </div>
                        <div className="text-xs text-gray-400">
                          → {calculateRealDepartureTime(train.departureTime)}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500">—</div>
                    )}
                  </div>

                  {/* Temps restant */}
                  <div className="w-32 flex-shrink-0">
                    {train && (
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          !!train.conductor
                            ? "bg-green-500/20 text-green-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {timeRemaining} restant
                      </div>
                    )}
                  </div>

                  {/* Conducteur */}
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
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <span>Niveau {train.conductor.level}</span>
                            {train.conductor.specialty && (
                              <>
                                <span>•</span>
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
                        <span className="font-medium">Conducteur requis</span>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">
                        Aucun train programmé
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-24 flex-shrink-0 text-right">
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant={
                          train?.conductor
                            ? "secondary"
                            : train
                            ? "default"
                            : "outline"
                        }
                        className="text-xs"
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
                        {train?.conductor
                          ? "Modifier"
                          : train
                          ? "Assigner"
                          : "Créer"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Nouveau composant d'historique */}
      <TrainHistory show={showHistory} onClose={() => setShowHistory(false)} />

      {/* Modal de sélection du conducteur - Version améliorée */}
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
                      Gestion du Train - {dayLabels[selectedTrain.day]}
                    </CardTitle>
                    <p className="text-sm text-gray-300 mt-1">
                      Créneau de départ : {selectedTrain.departureTime} →{" "}
                      {calculateRealDepartureTime(selectedTrain.departureTime)}{" "}
                      (Soir)
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

            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Section Informations du Train - Plus compacte */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      Informations du Créneau
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Jour :</span>
                        <span className="text-white font-medium">
                          {dayLabels[selectedTrain.day]}
                        </span>
                      </div>

                      {/* Sélection de l'heure */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
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
                          compact={false}
                          showPopular={true}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Départ réel :</span>
                        <span className="text-orange-400 font-bold">
                          {calculateRealDepartureTime(
                            selectedTrain.departureTime
                          )}
                        </span>
                      </div>

                      {selectedTrain.conductor && (
                        <div className="pt-3 border-t border-gray-700">
                          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <Crown className="w-5 h-5 text-green-400" />
                            <div>
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
                  </div>

                  {/* Actions principales */}
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          handleAssignConductor(
                            selectedTrain.id,
                            selectedTrain.conductor?.id || ""
                          )
                        }
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-3"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Validation...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            {selectedTrain.conductor
                              ? "✓ Valider les Modifications"
                              : "✓ Valider l'Assignation"}
                          </div>
                        )}
                      </Button>
                    </div>

                    {selectedTrain.conductor && (
                      <Button
                        onClick={() =>
                          handleAssignConductor(selectedTrain.id, "")
                        }
                        disabled={loading}
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 py-3"
                      >
                        <UserMinus className="w-5 h-5 mr-2" />
                        Retirer le Conducteur
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
                                        Inactif
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

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              <span className="text-white">Traitement en cours...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
