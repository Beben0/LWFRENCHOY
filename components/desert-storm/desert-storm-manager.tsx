"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  Crown,
  Edit,
  Plus,
  Shield,
  Sword,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface DesertStormEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  enemyTeamAAllianceName?: string;
  enemyTeamBAllianceName?: string;
  enemyTeamAScore: number;
  enemyTeamBScore: number;
  status: "PREPARATION" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  result?: "TEAM_A_VICTORY" | "TEAM_B_VICTORY" | "DRAW";
  participants: DesertStormParticipant[];
  dailyResults: DesertStormDaily[];
}

interface DesertStormParticipant {
  id: string;
  team: "TEAM_A" | "TEAM_B";
  totalKills: number;
  totalDeaths: number;
  totalDamage: string;
  powerGain: string;
  powerLoss: string;
  participation: number;
  rank?: number;
  rewards: string[];
  points: number;
  isSubstitute: boolean;
  member: {
    id: string;
    pseudo: string;
    level: number;
    power: string;
  };
  dailyResults: DesertStormDaily[];
}

interface DesertStormDaily {
  id: string;
  participantId?: string | null;
  date: string;
  teamA: number;
  teamB: number;
  kills: number;
  deaths: number;
  damage: string;
  participated: boolean;
  events: string[];
  notes?: string;
}

interface DesertStormManagerProps {
  eventId: string;
}

const statusConfig = {
  PREPARATION: {
    label: "Préparation",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Clock,
  },
  ACTIVE: {
    label: "En cours",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: Zap,
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: Trophy,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: Shield,
  },
};

const teamConfig = {
  TEAM_A: {
    name: "Équipe A",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Shield,
  },
  TEAM_B: {
    name: "Équipe B",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: Sword,
  },
};

export function DesertStormManager({ eventId }: DesertStormManagerProps) {
  const [event, setEvent] = useState<DesertStormEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTeam, setViewTeam] = useState<"TEAM_A" | "TEAM_B">("TEAM_A");
  const [showSubs, setShowSubs] = useState<{
    [key in "TEAM_A" | "TEAM_B"]: boolean;
  }>({
    TEAM_A: false,
    TEAM_B: false,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [allMembers, setAllMembers] = useState<
    { id: string; pseudo: string }[]
  >([]);

  const {
    register: addReg,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
  } = useForm<{
    memberId: string;
    team: "TEAM_A" | "TEAM_B";
    isSubstitute: boolean;
  }>({
    defaultValues: { team: "TEAM_A", isSubstitute: false },
  });

  const {
    register: scoreReg,
    handleSubmit: handleScoreSubmit,
    reset: resetScore,
  } = useForm<{
    teamAScore: number;
    enemyTeamAScore: number;
    teamBScore: number;
    enemyTeamBScore: number;
  }>({
    defaultValues: {
      teamAScore: event?.teamAScore ?? 0,
      enemyTeamAScore: event?.enemyTeamAScore ?? 0,
      teamBScore: event?.teamBScore ?? 0,
      enemyTeamBScore: event?.enemyTeamBScore ?? 0,
    },
  });

  const {
    register: editReg,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
  } = useForm<any>({
    defaultValues: { ...(event ?? {}), status: event?.status ?? "PREPARATION" },
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    fetch("/api/members?limit=1000")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const arr = Array.isArray(d)
          ? d
          : Array.isArray(d.data)
          ? d.data
          : Array.isArray(d.members)
          ? d.members
          : [];
        setAllMembers(arr);
      })
      .catch(() => setAllMembers([]));
  }, []);

  useEffect(() => {
    if (event) {
      resetScore({
        teamAScore: event.teamAScore,
        enemyTeamAScore: event.enemyTeamAScore,
        teamBScore: event.teamBScore,
        enemyTeamBScore: event.enemyTeamBScore,
      });

      resetEdit({
        title: event.title,
        description: event.description ?? "",
        startDate: event.startDate.slice(0, 16),
        endDate: event.endDate.slice(0, 16),
        teamAName: event.teamAName,
        teamBName: event.teamBName,
        enemyTeamAAllianceName: event.enemyTeamAAllianceName ?? "",
        enemyTeamBAllianceName: event.enemyTeamBAllianceName ?? "",
        status: event.status,
      });
    }
  }, [event, resetScore, resetEdit]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/desert-storm/${eventId}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement de l'événement");
      }

      const data = await response.json();
      setEvent(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const getTeamParticipants = (team: "TEAM_A" | "TEAM_B") => {
    return event?.participants.filter((p) => p.team === team && p.member) || [];
  };

  const getTeamName = (team: "TEAM_A" | "TEAM_B") => {
    return team === "TEAM_A"
      ? event?.teamAName || "Équipe A"
      : event?.teamBName || "Équipe B";
  };

  const availableMembers = allMembers.filter(
    (m) => !event?.participants.some((p) => p.member?.id === m.id)
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <Translate>Chargement...</Translate>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-8 text-red-500">
        <Translate>Erreur</Translate>: {error || "Événement non trouvé"}
      </div>
    );
  }

  const StatusIcon = statusConfig[event.status]?.icon || Clock;

  const globalDaily = event.dailyResults
    .filter((d) => d.participantId === undefined || d.participantId === null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dailyTeamA = globalDaily.map((d, idx) => ({
    day: idx + 1,
    date: d.date,
    score: d.teamA,
  }));
  const dailyTeamB = globalDaily.map((d, idx) => ({
    day: idx + 1,
    date: d.date,
    score: d.teamB,
  }));

  const refresh = () => loadEvent();

  const onAdd = async (data: any) => {
    await fetch(`/api/desert-storm/${event?.id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAdd(false);
    resetAdd();
    refresh();
  };

  const onScore = async (data: any) => {
    await fetch(`/api/desert-storm/${event?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowScore(false);
    refresh();
  };

  const onEditEvent = async (data: any) => {
    await fetch(`/api/desert-storm/${event?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowEditEvent(false);
    refresh();
  };

  const getEnemyAlliance = (
    event: DesertStormEvent,
    team: "TEAM_A" | "TEAM_B"
  ) => {
    if (team === "TEAM_A") {
      return event.enemyTeamAAllianceName ?? "?";
    } else if (team === "TEAM_B") {
      return event.enemyTeamBAllianceName ?? "?";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* En-tête de l'événement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-500" />
                {event.title}
              </CardTitle>
              {event.description && (
                <p className="text-muted-foreground mt-1">
                  {event.description}
                </p>
              )}
              {(event.enemyTeamAAllianceName ||
                event.enemyTeamBAllianceName) && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Translate>Adversaires :</Translate>{" "}
                  {event.enemyTeamAAllianceName ?? "?"} /{" "}
                  {event.enemyTeamBAllianceName ?? "?"}
                </p>
              )}
            </div>
            <Badge className={statusConfig[event.status].color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              <Translate>{statusConfig[event.status].label}</Translate>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                <Translate>Période</Translate>
              </div>
              <div className="font-medium">
                {formatDate(new Date(event.startDate))} -{" "}
                {formatDate(new Date(event.endDate))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                <Translate>Participants</Translate>
              </div>
              <div className="font-medium">{event.participants.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                <Translate>Résultat</Translate>
              </div>
              <div className="font-medium">
                {event.result ? (
                  <Translate>
                    {event.result === "TEAM_A_VICTORY"
                      ? event.teamAName
                      : event.result === "TEAM_B_VICTORY"
                      ? event.teamBName
                      : "Égalité"}
                  </Translate>
                ) : (
                  <Translate>En cours</Translate>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores VS */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 border rounded-lg space-y-1">
          <div className="text-sm font-medium text-blue-500 flex items-center justify-center gap-1">
            <Shield className="w-4 h-4" /> {event.teamAName}
            <span className="mx-1">vs</span>
            <span className="text-orange-400">
              {getEnemyAlliance(event, "TEAM_A")}
            </span>
          </div>
          <div className="text-xl font-bold">
            {event.teamAScore} <span className="mx-1">vs</span>{" "}
            <span className="text-orange-500">{event.enemyTeamAScore}</span>
          </div>
        </div>
        <div className="p-4 border rounded-lg space-y-1">
          <div className="text-sm font-medium text-red-500 flex items-center justify-center gap-1">
            <Sword className="w-4 h-4" /> {event.teamBName}
            <span className="mx-1">vs</span>
            <span className="text-orange-400">
              {getEnemyAlliance(event, "TEAM_B")}
            </span>
          </div>
          <div className="text-xl font-bold">
            {event.teamBScore} <span className="mx-1">vs</span>{" "}
            <span className="text-orange-500">{event.enemyTeamBScore}</span>
          </div>
        </div>
      </div>

      {/* Classement général */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <Translate>Classement général</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>
                <Translate>Aucun participant pour le moment</Translate>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {event.participants
                .filter((p) => p.member)
                .slice()
                .sort(
                  (a, b) => b.points - a.points || b.totalKills - a.totalKills
                )
                .slice(0, 10)
                .map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        {index < 3 && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>

                      <div>
                        <div className="font-medium">
                          {participant.member.pseudo}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <Badge className={teamConfig[participant.team].color}>
                            {getTeamName(participant.team)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold">{participant.points} pts</div>
                      <div className="text-sm text-muted-foreground">
                        {participant.totalKills} K • {participant.totalDeaths} D
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {viewTeam === "TEAM_A" ? (
                <Shield className="w-5 h-5 text-blue-500" />
              ) : (
                <Sword className="w-5 h-5 text-red-500" />
              )}
              {getTeamName(viewTeam)} –
              {showSubs[viewTeam] ? " Remplaçants" : " Titulaires"}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewTeam === "TEAM_A" ? "default" : "secondary"}
                onClick={() => setViewTeam("TEAM_A")}
              >
                {event.teamAName}
              </Button>
              <Button
                size="sm"
                variant={viewTeam === "TEAM_B" ? "default" : "secondary"}
                onClick={() => setViewTeam("TEAM_B")}
              >
                {event.teamBName}
              </Button>
              <Button
                size="sm"
                variant={!showSubs[viewTeam] ? "default" : "secondary"}
                onClick={() =>
                  setShowSubs((s) => ({ ...s, [viewTeam]: false }))
                }
              >
                Titulaires
              </Button>
              <Button
                size="sm"
                variant={showSubs[viewTeam] ? "default" : "secondary"}
                onClick={() => setShowSubs((s) => ({ ...s, [viewTeam]: true }))}
              >
                Remplaçants
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Joueur</th>
                  <th className="p-2 text-right">Points</th>
                  <th className="p-2 text-right">Kills</th>
                  <th className="p-2 text-right">Morts</th>
                </tr>
              </thead>
              <tbody>
                {getTeamParticipants(viewTeam)
                  .filter((p) =>
                    showSubs[viewTeam] ? p.isSubstitute : !p.isSubstitute
                  )
                  .sort((a, b) => b.points - a.points)
                  .map((p, idx) => (
                    <tr key={p.id} className="border-b last:border-none">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{p.member.pseudo}</td>
                      <td className="p-2 text-right">{p.points}</td>
                      <td className="p-2 text-right">{p.totalKills}</td>
                      <td className="p-2 text-right">{p.totalDeaths}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historique par jour */}
      {globalDaily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <Translate>Historique quotidien</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A history */}
              <div>
                <h4 className="font-semibold flex items-center gap-1 text-blue-500 mb-2">
                  <Shield className="w-4 h-4" /> {event.teamAName}
                </h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Jour</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTeamA.map((d) => (
                      <tr key={d.day} className="border-b last:border-none">
                        <td className="p-2">{d.day}</td>
                        <td className="p-2">{formatDate(new Date(d.date))}</td>
                        <td className="p-2 text-right">{d.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Team B history */}
              <div>
                <h4 className="font-semibold flex items-center gap-1 text-red-500 mb-2">
                  <Sword className="w-4 h-4" /> {event.teamBName}
                </h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Jour</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTeamB.map((d) => (
                      <tr key={d.day} className="border-b last:border-none">
                        <td className="p-2">{d.day}</td>
                        <td className="p-2">{formatDate(new Date(d.date))}</td>
                        <td className="p-2 text-right">{d.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions d'administration */}
      <PermissionGuard permission="edit_desert_storm">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              <Translate>Administration</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <PermissionGuard permission="manage_desert_storm_participants">
                <Button variant="outline" onClick={() => setShowAdd(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  <Translate>Ajouter participant</Translate>
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="edit_desert_storm_results">
                <Button variant="outline" onClick={() => setShowScore(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  <Translate>Modifier scores</Translate>
                </Button>
              </PermissionGuard>

              <PermissionGuard permission="edit_desert_storm">
                <Button
                  variant="outline"
                  onClick={() => setShowEditEvent(true)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  <Translate>Modifier événement</Translate>
                </Button>
              </PermissionGuard>
            </div>
          </CardContent>
        </Card>
      </PermissionGuard>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg w-[420px] space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <Translate>Ajouter participant</Translate>
            </h3>
            <form onSubmit={handleAddSubmit(onAdd)} className="space-y-4">
              <select
                {...addReg("memberId", { required: true })}
                className="w-full bg-background border p-2 rounded"
              >
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.pseudo}
                  </option>
                ))}
              </select>
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <input type="radio" value="TEAM_A" {...addReg("team")} /> A
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" value="TEAM_B" {...addReg("team")} /> B
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...addReg("isSubstitute")} />{" "}
                <Translate>Remplaçant</Translate>
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAdd(false)}
                >
                  <Translate>Annuler</Translate>
                </Button>
                <Button type="submit">
                  <Translate>Ajouter</Translate>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showScore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg w-[420px] space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Edit className="w-4 h-4" />{" "}
              <Translate>Modifier scores</Translate>
            </h3>
            <form
              onSubmit={handleScoreSubmit(onScore)}
              className="space-y-3 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs">
                    <Translate>Score équipe A</Translate>
                  </label>
                  <input
                    type="number"
                    {...scoreReg("teamAScore", { valueAsNumber: true })}
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">
                    <Translate>Score ennemi A</Translate>
                  </label>
                  <input
                    type="number"
                    {...scoreReg("enemyTeamAScore", { valueAsNumber: true })}
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">
                    <Translate>Score équipe B</Translate>
                  </label>
                  <input
                    type="number"
                    {...scoreReg("teamBScore", { valueAsNumber: true })}
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">
                    <Translate>Score ennemi B</Translate>
                  </label>
                  <input
                    type="number"
                    {...scoreReg("enemyTeamBScore", { valueAsNumber: true })}
                    className="p-2 border rounded w-full"
                  />
                </div>
              </div>
              {/* Résultat calculé automatiquement */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowScore(false)}
                >
                  <Translate>Annuler</Translate>
                </Button>
                <Button type="submit">
                  <Translate>Enregistrer</Translate>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-card p-6 rounded-lg w-[480px] space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-4 h-4" />{" "}
              <Translate>Modifier événement</Translate>
            </h3>
            <form
              onSubmit={handleEditSubmit(onEditEvent)}
              className="space-y-3 text-sm"
            >
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Titre</Translate>
                </label>
                <input
                  type="text"
                  {...editReg("title")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Description</Translate>
                </label>
                <textarea
                  {...editReg("description")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Date de début</Translate>
                </label>
                <input
                  type="datetime-local"
                  {...editReg("startDate")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Date de fin</Translate>
                </label>
                <input
                  type="datetime-local"
                  {...editReg("endDate")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Nom équipe A</Translate>
                </label>
                <input
                  type="text"
                  {...editReg("teamAName")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Nom équipe B</Translate>
                </label>
                <input
                  type="text"
                  {...editReg("teamBName")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Alliance ennemie A</Translate>
                </label>
                <input
                  type="text"
                  {...editReg("enemyTeamAAllianceName")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Alliance ennemie B</Translate>
                </label>
                <input
                  type="text"
                  {...editReg("enemyTeamBAllianceName")}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">
                  <Translate>Statut</Translate>
                </label>
                <select
                  {...editReg("status")}
                  className="w-full p-2 border rounded"
                >
                  <option value="PREPARATION">Préparation</option>
                  <option value="ACTIVE">En cours</option>
                  <option value="COMPLETED">Terminé</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowEditEvent(false)}
                >
                  <Translate>Annuler</Translate>
                </Button>
                <Button type="submit">
                  <Translate>Enregistrer</Translate>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
