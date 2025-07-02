"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import { formatDate } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  Edit,
  Plus,
  Shield,
  Sword,
  Target,
  Trash2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  _count: {
    participants: number;
  };
}

interface DesertStormParticipant {
  id: string;
  team: "TEAM_A" | "TEAM_B";
  totalKills: number;
  totalDeaths: number;
  points: number;
  member: {
    id: string;
    pseudo: string;
  };
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

export default function AdminDesertStormPage() {
  const [events, setEvents] = useState<DesertStormEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/desert-storm");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des événements");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    try {
      setDeletingId(eventId);
      const response = await fetch(`/api/desert-storm/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la suppression de l'événement");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return Clock;
    return config.icon;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <Translate>Chargement...</Translate>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-red-500">
          <Translate>Erreur</Translate>: {error}
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="view_desert_storm">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-orange-500" />
              <Translate>Administration Desert Storm</Translate>
            </h1>
            <p className="text-muted-foreground">
              <Translate>Gérer les événements Desert Storm</Translate>
            </p>
          </div>

          <div className="flex gap-2">
            <PermissionGuard permission="create_desert_storm">
              <Link href="/admin/desert-storm/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  <Translate>Nouvel événement</Translate>
                </Button>
              </Link>
            </PermissionGuard>
            <PermissionGuard permission="edit_desert_storm_results">
              <Link href="/admin/desert-storm/quick-entry">
                <Button variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  <Translate>Saisie rapide</Translate>
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {events.filter((e) => e.status === "ACTIVE").length}
              </div>
              <div className="text-sm text-muted-foreground">
                <Translate>En cours</Translate>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">
                {events.filter((e) => e.status === "PREPARATION").length}
              </div>
              <div className="text-sm text-muted-foreground">
                <Translate>En préparation</Translate>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-500">
                {events.filter((e) => e.status === "COMPLETED").length}
              </div>
              <div className="text-sm text-muted-foreground">
                <Translate>Terminés</Translate>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">
                {events.reduce((sum, e) => sum + e._count.participants, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                <Translate>Participants totaux</Translate>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des événements */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Translate>Événements Desert Storm</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  <Translate>Aucun événement</Translate>
                </h3>
                <p className="text-muted-foreground">
                  <Translate>
                    Commencez par créer votre premier événement Desert Storm.
                  </Translate>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const StatusIcon = getStatusIcon(event.status);
                  return (
                    <Card key={event.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">
                                {event.title}
                              </h3>
                              <Badge
                                className={statusConfig[event.status].color}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                <Translate>
                                  {statusConfig[event.status].label}
                                </Translate>
                              </Badge>
                            </div>

                            {event.description && (
                              <p className="text-muted-foreground text-sm">
                                {event.description}
                              </p>
                            )}

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="w-4 h-4" />
                                {formatDate(new Date(event.startDate))} -{" "}
                                {formatDate(new Date(event.endDate))}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <Translate>
                                  {event._count.participants} participants
                                </Translate>
                              </div>
                            </div>

                            {/* Scores VS */}
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                {event.teamAName}{" "}
                                <span className="font-semibold">
                                  {event.teamAScore}
                                </span>
                                <span className="mx-1">vs</span>
                                <span className="font-semibold text-orange-500">
                                  {event.enemyTeamAScore}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Sword className="w-4 h-4 text-red-500" />
                                {event.teamBName}{" "}
                                <span className="font-semibold">
                                  {event.teamBScore}
                                </span>
                                <span className="mx-1">vs</span>
                                <span className="font-semibold text-orange-500">
                                  {event.enemyTeamBScore}
                                </span>
                              </div>
                              {(event.enemyTeamAAllianceName ||
                                event.enemyTeamBAllianceName) && (
                                <div className="text-xs text-muted-foreground">
                                  <Translate>Adversaires :</Translate>{" "}
                                  {event.enemyTeamAAllianceName ?? "?"} /{" "}
                                  {event.enemyTeamBAllianceName ?? "?"}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <PermissionGuard permission="edit_desert_storm">
                              <Link href={`/admin/desert-storm/${event.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                            </PermissionGuard>

                            <PermissionGuard permission="delete_desert_storm">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(event.id)}
                                disabled={deletingId === event.id}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
