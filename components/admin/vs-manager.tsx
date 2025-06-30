"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Edit,
  Plus,
  Save,
  Skull,
  Sword,
  Target,
  Trophy,
  X,
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
  _count: {
    participants: number;
  };
  participants?: VSParticipant[];
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

interface VSFormData {
  year: number;
  weekNumber: number;
  title: string;
  enemyName: string;
  allianceScore: number;
  enemyScore: number;
  status: string;
  result?: string;
}

interface VSParticipant {
  id: string;
  memberPseudo: string;
  points: number;
  dailyResults?: VSParticipantDay[];
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

export function VSManager() {
  const [vsWeeks, setVSWeeks] = useState<VSWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWeek, setEditingWeek] = useState<VSWeek | null>(null);
  const [formData, setFormData] = useState<VSFormData>({
    year: new Date().getFullYear(),
    weekNumber:
      (Math.ceil(new Date().getTime() / (7 * 24 * 60 * 60 * 1000)) % 52) + 1,
    title: "",
    enemyName: "",
    allianceScore: 0,
    enemyScore: 0,
    status: "PREPARATION",
    result: undefined,
  });

  const loadVSWeeks = async () => {
    setLoading(true);
    const res = await fetch(
      "/api/vs?limit=20&includeParticipants=true&includeDays=true"
    );
    const data = await res.json();
    console.log("🐞 DEBUG - API Response:", data);
    console.log("🐞 DEBUG - Weeks:", data.weeks);
    if (data.weeks?.[0]) {
      console.log(
        "🐞 DEBUG - First week participants:",
        data.weeks[0].participants
      );
    }
    setVSWeeks(data.weeks || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = editingWeek ? "update_week" : "create_week";
      const payload: any = {
        action,
        weekData: {
          ...formData,
          ...(editingWeek && { weekId: editingWeek.id }),
          startDate: new Date(
            formData.year,
            0,
            (formData.weekNumber - 1) * 7 + 1
          ).toISOString(),
          endDate: new Date(
            formData.year,
            0,
            formData.weekNumber * 7
          ).toISOString(),
        },
      };

      const response = await fetch("/api/vs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadVSWeeks();
        setShowForm(false);
        setEditingWeek(null);
        setFormData({
          year: new Date().getFullYear(),
          weekNumber:
            (Math.ceil(new Date().getTime() / (7 * 24 * 60 * 60 * 1000)) % 52) +
            1,
          title: "",
          enemyName: "",
          allianceScore: 0,
          enemyScore: 0,
          status: "PREPARATION",
          result: undefined,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleEdit = (week: VSWeek) => {
    setEditingWeek(week);
    setFormData({
      year: week.year,
      weekNumber: week.weekNumber,
      title: week.title || "",
      enemyName: week.enemyName || "",
      allianceScore: week.allianceScore,
      enemyScore: week.enemyScore,
      status: week.status,
      result: week.result,
    });
    setShowForm(true);
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case "VICTORY":
        return "text-green-400 bg-green-500/20";
      case "DEFEAT":
        return "text-red-400 bg-red-500/20";
      case "DRAW":
        return "text-yellow-400 bg-yellow-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getResultIcon = (result?: string) => {
    switch (result) {
      case "VICTORY":
        return <Trophy className="w-4 h-4" />;
      case "DEFEAT":
        return <Skull className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    loadVSWeeks();
  }, []);

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Sword className="w-6 h-6 animate-spin mr-2 text-orange-400" />
            <span className="text-gray-300">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <Sword className="w-6 h-6 text-orange-400" />
              Gestion des VS
            </CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle semaine VS
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Formulaire */}
      {showForm && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingWeek
                ? "Modifier la semaine VS"
                : "Créer une nouvelle semaine VS"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Année
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Numéro de semaine
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="53"
                    value={formData.weekNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weekNumber: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Titre (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Ex: VS de la rentrée"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Alliance ennemie
                </label>
                <input
                  type="text"
                  value={formData.enemyName}
                  onChange={(e) =>
                    setFormData({ ...formData, enemyName: e.target.value })
                  }
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Ex: DragonSlayers"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Score alliance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.allianceScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allianceScore: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Score ennemi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.enemyScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enemyScore: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="PREPARATION">Préparation</option>
                    <option value="ACTIVE">En cours</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Résultat final
                  </label>
                  <select
                    value={formData.result || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        result: e.target.value || undefined,
                      })
                    }
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="">Non défini</option>
                    <option value="VICTORY">Victoire</option>
                    <option value="DEFEAT">Défaite</option>
                    <option value="DRAW">Égalité</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingWeek(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des semaines VS */}
      <div className="space-y-4">
        {vsWeeks.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Sword className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucune semaine VS
              </h3>
              <p className="text-gray-400">
                Créez votre première semaine VS pour commencer
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
                      {week._count.participants} participants • {week.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {week.result && (
                      <Badge className={getResultColor(week.result)}>
                        {getResultIcon(week.result)}
                        <span className="ml-1">
                          {week.result === "VICTORY" && "Victoire"}
                          {week.result === "DEFEAT" && "Défaite"}
                          {week.result === "DRAW" && "Égalité"}
                        </span>
                      </Badge>
                    )}
                    <Button
                      onClick={() => handleEdit(week)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Score final */}
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Score Final
                    </h4>
                    <div className="flex items-center justify-center gap-4 text-xl font-bold">
                      <span className="text-blue-400">
                        {week.allianceScore}
                      </span>
                      <span className="text-gray-500">-</span>
                      <span className="text-red-400">{week.enemyScore}</span>
                    </div>
                  </div>

                  {/* Résultats par jour */}
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Résultats par jour
                    </h4>
                    <div className="grid grid-cols-6 gap-1">
                      {Array.from({ length: 6 }, (_, i) => {
                        const day = week.days?.find(
                          (d) => d.dayNumber === i + 1
                        );
                        const hasResult =
                          day && (day.allianceScore > 0 || day.enemyScore > 0);

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

                {week.participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-gray-800/40 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-orange-400">
                        {participant.memberPseudo}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({participant.points} pts)
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }, (_, dayIdx) => {
                        const day = participant.dailyResults?.find(
                          (d) => d.dayNumber === dayIdx + 1
                        );
                        return (
                          <DailyResultAdminCell
                            key={dayIdx}
                            day={day}
                            participantId={participant.id}
                            reload={loadVSWeeks}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function DailyResultAdminCell({
  day,
  participantId,
  reload,
}: {
  day: any;
  participantId: string;
  reload: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    kills: day?.kills || 0,
    deaths: day?.deaths || 0,
    participated: day?.participated || false,
    mvpPoints: day?.mvpPoints || 0,
    notes: day?.notes || "",
    events: day?.events?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await fetch("/api/vs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_participant_day",
        participantDayData: {
          participantId,
          dayNumber: day.dayNumber,
          kills: Number(form.kills),
          deaths: Number(form.deaths),
          participated: !!form.participated,
          mvpPoints: Number(form.mvpPoints),
          notes: form.notes,
          events: form.events
            .split(",")
            .map((e: string) => e.trim())
            .filter(Boolean),
        },
      }),
    });
    setLoading(false);
    setEdit(false);
    reload && reload();
  };

  if (!day)
    return (
      <div className="bg-gray-900/30 p-2 rounded text-xs text-gray-500">-</div>
    );
  if (!edit)
    return (
      <div className="bg-gray-900/30 p-2 rounded text-xs text-center relative group">
        <div className="font-semibold text-gray-300">J{day.dayNumber}</div>
        <div>
          {day.participated ? (
            <span className="text-green-400">✔</span>
          ) : (
            <span className="text-gray-500">✗</span>
          )}
        </div>
        <div className="text-xs text-orange-400">{day.kills}K</div>
        <div className="text-xs text-red-400">{day.deaths}D</div>
        <button
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-yellow-400"
          onClick={() => setEdit(true)}
          title="Éditer"
        >
          ✏️
        </button>
      </div>
    );
  return (
    <div className="bg-gray-900/50 p-2 rounded text-xs">
      <div className="mb-1 font-semibold text-gray-300">J{day.dayNumber}</div>
      <div className="flex flex-col gap-1">
        <input
          type="number"
          className="bg-gray-800 rounded px-1 py-0.5 text-xs"
          value={form.kills}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, kills: e.target.value }))
          }
          placeholder="Kills"
        />
        <input
          type="number"
          className="bg-gray-800 rounded px-1 py-0.5 text-xs"
          value={form.deaths}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, deaths: e.target.value }))
          }
          placeholder="Morts"
        />
        <input
          type="number"
          className="bg-gray-800 rounded px-1 py-0.5 text-xs"
          value={form.mvpPoints}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, mvpPoints: e.target.value }))
          }
          placeholder="MVP"
        />
        <input
          type="text"
          className="bg-gray-800 rounded px-1 py-0.5 text-xs"
          value={form.events}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, events: e.target.value }))
          }
          placeholder="Events (virgule)"
        />
        <input
          type="text"
          className="bg-gray-800 rounded px-1 py-0.5 text-xs"
          value={form.notes}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({ ...f, notes: e.target.value }))
          }
          placeholder="Notes"
        />
        <label className="flex items-center gap-1 text-xs mt-1">
          <input
            type="checkbox"
            checked={form.participated}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm((f) => ({ ...f, participated: e.target.checked }))
            }
          />{" "}
          Participé
        </label>
        <div className="flex gap-1 mt-1">
          <button
            className="bg-green-700 hover:bg-green-800 text-white rounded px-2 py-0.5 text-xs"
            onClick={save}
            disabled={loading}
          >
            OK
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-800 text-white rounded px-2 py-0.5 text-xs"
            onClick={() => setEdit(false)}
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
