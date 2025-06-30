"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { Save, Target, Trophy, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  pseudo: string;
  allianceRole: string;
  status: string;
}

interface VSWeek {
  id: string;
  startDate: string;
  endDate: string;
  enemyName: string;
  status: string;
}

interface DayEntry {
  day: number;
  date: string;
  points: number;
  isToday?: boolean;
}

interface MemberEntry {
  memberId: string;
  pseudo: string;
  dailyPoints: DayEntry[];
  totalPoints: number;
}

export default function QuickEntryPage() {
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [currentVS, setCurrentVS] = useState<VSWeek | null>(null);
  const [entries, setEntries] = useState<MemberEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !hasPermission(session, "edit_vs")) {
      redirect("/auth/signin");
      return;
    }

    loadData();
  }, [session, status]);

  const loadData = async () => {
    try {
      // Charger les membres actifs
      const membersResponse = await fetch(
        "/api/members?status=ACTIVE&limit=100"
      );
      const membersData = await membersResponse.json();
      const activeMembers = membersData.members || [];
      setMembers(activeMembers);

      // Charger le VS actuel
      const vsResponse = await fetch("/api/vs?status=ACTIVE");
      const vsData = await vsResponse.json();
      if (vsData.length > 0) {
        const vs = vsData[0];
        setCurrentVS(vs);
        loadEntries(vs, activeMembers);
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (vsWeek: VSWeek, membersList: Member[]) => {
    try {
      const response = await fetch(`/api/vs/${vsWeek.id}/entries`);
      const data = await response.json();

      // Regrouper les données par participant/membre
      const participantMap = new Map();
      data.forEach((entry: any) => {
        const memberId = entry.participant.member.id;
        if (!participantMap.has(memberId)) {
          participantMap.set(memberId, {
            memberId,
            pseudo: entry.participant.member.pseudo,
            entries: [],
          });
        }
        participantMap.get(memberId).entries.push({
          day: entry.dayNumber,
          points: entry.mvpPoints || 0,
        });
      });

      // Initialiser les entrées pour chaque membre
      const memberEntries: MemberEntry[] = membersList.map((member) => {
        const existingData = participantMap.get(member.id);
        const dailyPoints: DayEntry[] = [];

        // Créer 6 jours (lundi à samedi)
        for (let day = 1; day <= 6; day++) {
          const existing = existingData?.entries.find(
            (e: any) => e.day === day
          );
          const date = getDateForDayWithWeek(vsWeek, day);

          dailyPoints.push({
            day,
            date,
            points: existing?.points || 0,
            isToday: isToday(date),
          });
        }

        const totalPoints = dailyPoints.reduce(
          (sum, day) => sum + day.points,
          0
        );

        return {
          memberId: member.id,
          pseudo: member.pseudo,
          dailyPoints,
          totalPoints,
        };
      });

      setEntries(memberEntries);
    } catch (error) {
      console.error("Erreur chargement entrées:", error);
    }
  };

  const getDateForDay = (day: number): string => {
    if (!currentVS) return "";
    const startDate = new Date(currentVS.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + day - 1);
    return targetDate.toISOString().split("T")[0];
  };

  const isToday = (dateStr: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  const updatePoints = (memberId: string, day: number, points: number) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.memberId === memberId) {
          const updatedDailyPoints = entry.dailyPoints.map((dayEntry) =>
            dayEntry.day === day ? { ...dayEntry, points } : dayEntry
          );
          const totalPoints = updatedDailyPoints.reduce(
            (sum, dayEntry) => sum + dayEntry.points,
            0
          );

          return {
            ...entry,
            dailyPoints: updatedDailyPoints,
            totalPoints,
          };
        }
        return entry;
      })
    );
  };

  const saveEntries = async () => {
    if (!currentVS) return;

    setSaving(true);
    try {
      // Préparer les données pour la sauvegarde
      const entriesToSave = entries.flatMap((member) =>
        member.dailyPoints
          .filter((day) => day.points > 0)
          .map((day) => ({
            vsWeekId: currentVS.id,
            memberId: member.memberId,
            day: day.day,
            date: day.date,
            points: day.points,
          }))
      );

      const response = await fetch(`/api/vs/${currentVS.id}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entriesToSave }),
      });

      if (response.ok) {
        alert("Points sauvegardés avec succès !");
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getDayLabel = (day: number): string => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days[day - 1];
  };

  // Utilitaire pour calculer la date basée sur un VSWeek donné
  const getDateForDayWithWeek = (week: VSWeek, day: number): string => {
    const start = new Date(week.startDate);
    const d = new Date(start);
    d.setDate(start.getDate() + day - 1);
    return d.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentVS) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Aucun VS actif</h2>
            <p className="text-gray-600 mb-4">
              Créez d'abord un VS dans la gestion VS
            </p>
            <Button onClick={() => (window.location.href = "/admin/vs")}>
              Gérer les VS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-400 flex items-center gap-2">
            ⚡ Saisie Rapide VS
          </h1>
          <p className="text-gray-400">
            VS contre {currentVS.enemyName} -{" "}
            {new Date(currentVS.startDate).toLocaleDateString("fr-FR")} au{" "}
            {new Date(currentVS.endDate).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={saveEntries}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Sélecteur de jour pour mobile */}
      <Card className="md:hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Jour sélectionné :</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1"
            >
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  {getDayLabel(day)} - {getDateForDay(day)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table de saisie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Points par membre et par jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 font-semibold">Membre</th>
                  {/* Desktop: Tous les jours */}
                  <th className="hidden md:table-cell text-center p-3 font-semibold">
                    Lun
                  </th>
                  <th className="hidden md:table-cell text-center p-3 font-semibold">
                    Mar
                  </th>
                  <th className="hidden md:table-cell text-center p-3 font-semibold">
                    Mer
                  </th>
                  <th className="hidden md:table-cell text-center p-3 font-semibold">
                    Jeu
                  </th>
                  <th className="hidden md:table-cell text-center p-3 font-semibold">
                    Ven
                  </th>
                  <th className="hidden md:table-cell text-center p-3 font-semibold">
                    Sam
                  </th>
                  {/* Mobile: Jour sélectionné */}
                  <th className="md:hidden text-center p-3 font-semibold">
                    {getDayLabel(selectedDay)}
                  </th>
                  <th className="text-center p-3 font-semibold text-yellow-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.memberId}
                    className="border-b border-gray-800 hover:bg-gray-800/30"
                  >
                    <td className="p-3 font-medium">{entry.pseudo}</td>

                    {/* Desktop: Tous les jours */}
                    {entry.dailyPoints.map((day) => (
                      <td
                        key={day.day}
                        className="hidden md:table-cell text-center p-3"
                      >
                        <input
                          type="number"
                          value={day.points || ""}
                          onChange={(e) =>
                            updatePoints(
                              entry.memberId,
                              day.day,
                              Number(e.target.value) || 0
                            )
                          }
                          className={`w-32 px-2 py-1 text-center rounded border ${
                            day.isToday
                              ? "bg-orange-900/50 border-orange-500"
                              : "bg-gray-800 border-gray-600"
                          } focus:outline-none focus:border-blue-500`}
                          min="0"
                        />
                      </td>
                    ))}

                    {/* Mobile: Jour sélectionné */}
                    <td className="md:hidden text-center p-3">
                      <input
                        type="number"
                        value={entry.dailyPoints[selectedDay - 1]?.points || ""}
                        onChange={(e) =>
                          updatePoints(
                            entry.memberId,
                            selectedDay,
                            Number(e.target.value) || 0
                          )
                        }
                        className={`w-32 px-2 py-1 text-center rounded border ${
                          entry.dailyPoints[selectedDay - 1]?.isToday
                            ? "bg-orange-900/50 border-orange-500"
                            : "bg-gray-800 border-gray-600"
                        } focus:outline-none focus:border-blue-500`}
                        min="0"
                      />
                    </td>

                    <td className="text-center p-3">
                      <span className="text-yellow-400 font-bold text-lg">
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {entries
                    .reduce((sum, entry) => sum + entry.totalPoints, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Points totaux</p>
              </div>
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {entries.filter((entry) => entry.totalPoints > 0).length}
                </p>
                <p className="text-xs text-gray-400">Membres actifs</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {Math.round(
                    entries.reduce((sum, entry) => sum + entry.totalPoints, 0) /
                      Math.max(
                        entries.filter((entry) => entry.totalPoints > 0).length,
                        1
                      )
                  )}
                </p>
                <p className="text-xs text-gray-400">Moyenne par membre</p>
              </div>
              <Target className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
