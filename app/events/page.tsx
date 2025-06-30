"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  Clock,
  Crown,
  Edit,
  Plus,
  Repeat,
  Server,
  Star,
  Sword,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  title: string;
  description?: string;
  detailedDescription?: string;
  type:
    | "ALLIANCE_WAR"
    | "BOSS_FIGHT"
    | "SERVER_WAR"
    | "SEASONAL"
    | "GUERRE_ALLIANCE"
    | "EVENT_SPECIAL"
    | "MAINTENANCE"
    | "FORMATION"
    | "REUNION"
    | "AUTRE";
  tags?: string[];
  startDate: string;
  endDate?: string;
  isRecurring?: boolean;
  recurringDays?: number[];
  recurringEndDate?: string;
}

const eventTypeConfig = {
  ALLIANCE_WAR: {
    icon: Sword,
    label: "Guerre d'Alliance",
    color: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/20",
  },
  BOSS_FIGHT: {
    icon: Crown,
    label: "Boss d'Alliance",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10 border-orange-500/20",
  },
  SERVER_WAR: {
    icon: Server,
    label: "Guerre de Serveur",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  SEASONAL: {
    icon: Star,
    label: "Événement Saisonnier",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
  GUERRE_ALLIANCE: {
    icon: Sword,
    label: "Guerre Alliance",
    color: "text-red-600",
    bgColor: "bg-red-600/10 border-red-600/20",
  },
  EVENT_SPECIAL: {
    icon: Star,
    label: "Événement Spécial",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
  },
  MAINTENANCE: {
    icon: Server,
    label: "Maintenance",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10 border-gray-500/20",
  },
  FORMATION: {
    icon: Users,
    label: "Formation",
    color: "text-green-500",
    bgColor: "bg-green-500/10 border-green-500/20",
  },
  REUNION: {
    icon: Calendar,
    label: "Réunion",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10 border-blue-600/20",
  },
  AUTRE: {
    icon: Tag,
    label: "Autre",
    color: "text-gray-600",
    bgColor: "bg-gray-600/10 border-gray-600/20",
  },
};

const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "recurring">(
    "upcoming"
  );
  const router = useRouter();
  const session = useSession();

  const fetchEvents = async () => {
    try {
      const [upcomingResponse, pastResponse, recurringResponse] =
        await Promise.all([
          fetch("/api/events?upcoming=true"),
          fetch("/api/events?past=true"),
          fetch("/api/events?recurring=true"),
        ]);

      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        setUpcomingEvents(Array.isArray(upcomingData) ? upcomingData : []);
      }

      if (pastResponse.ok) {
        const pastData = await pastResponse.json();
        setPastEvents(Array.isArray(pastData) ? pastData.slice(0, 10) : []);
      }

      if (recurringResponse.ok) {
        const recurringData = await recurringResponse.json();
        setRecurringEvents(Array.isArray(recurringData) ? recurringData : []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (eventId: string) => {
    if (hasPermission(session.data, "edit_event")) {
      router.push(`/events-crud?edit=${eventId}`);
    } else {
      alert("Vous n'avez pas la permission de modifier cet événement.");
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!hasPermission(session.data, "delete_event")) {
      alert("Vous n'avez pas la permission de supprimer cet événement.");
      return;
    }

    if (!confirm("Supprimer cet événement ?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEvents(); // Recharger les données
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur de connexion");
    }
  };

  const handleCreateNew = () => {
    if (hasPermission(session.data, "create_event")) {
      router.push("/events-crud");
    } else {
      alert("Vous n'avez pas la permission de créer un nouvel événement.");
    }
  };

  const renderEventCard = (event: Event) => {
    const config = eventTypeConfig[event.type] || eventTypeConfig.AUTRE;
    const Icon = config.icon;

    return (
      <Card
        key={event.id}
        className={`hover:shadow-md transition-shadow ${config.bgColor}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                  {event.isRecurring && (
                    <Badge variant="outline" className="text-purple-600">
                      <Repeat className="w-3 h-3 mr-1" />
                      Récurrent
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {hasPermission(session.data, "edit_event") && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(event.id)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {event.description}
            </p>
          )}

          {/* Description détaillée */}
          {event.detailedDescription && (
            <div className="text-sm text-muted-foreground mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="whitespace-pre-wrap">{event.detailedDescription}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Dates */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                Début: {formatDate(new Date(event.startDate))}
                {event.endDate &&
                  ` - Fin: ${formatDate(new Date(event.endDate))}`}
              </span>
            </div>

            {/* Récurrence */}
            {event.isRecurring && event.recurringDays && (
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-muted-foreground" />
                <span>
                  Répété:{" "}
                  {event.recurringDays.map((day) => dayNames[day]).join(", ")}
                  {event.recurringEndDate &&
                    ` jusqu'au ${formatDate(new Date(event.recurringEndDate))}`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lastwar-orange mx-auto"></div>
          <p className="mt-4">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header amélioré */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Calendar className="w-6 h-6 text-lastwar-orange" />
                Événements d'Alliance
              </CardTitle>
              <p className="text-sm text-gray-400 mt-2">
                Gestion complète des événements •{" "}
                {upcomingEvents.length + recurringEvents.length} événements
                actifs
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasPermission(session.data, "create_event") && (
                <Button
                  className="lastwar-gradient text-black hover:opacity-90 transition-opacity"
                  onClick={handleCreateNew}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Nouvel Événement</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Navigation améliorés */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
        <Button
          variant={activeTab === "upcoming" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 justify-center sm:justify-start ${
            activeTab === "upcoming"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Prochains</span>
          <Badge
            variant="secondary"
            className="ml-1 bg-gray-600 text-white text-xs"
          >
            {upcomingEvents.length}
          </Badge>
        </Button>
        <Button
          variant={activeTab === "recurring" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("recurring")}
          className={`flex items-center gap-2 justify-center sm:justify-start ${
            activeTab === "recurring"
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Récurrents</span>
          <Badge
            variant="secondary"
            className="ml-1 bg-gray-600 text-white text-xs"
          >
            {recurringEvents.length}
          </Badge>
        </Button>
        <Button
          variant={activeTab === "past" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("past")}
          className={`flex items-center gap-2 justify-center sm:justify-start ${
            activeTab === "past"
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Passés</span>
          <Badge
            variant="secondary"
            className="ml-1 bg-gray-600 text-white text-xs"
          >
            {pastEvents.length}
          </Badge>
        </Button>
      </div>

      {/* Quick Stats améliorés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {upcomingEvents.length}
                </p>
                <p className="text-sm text-gray-400">Prochains</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Repeat className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {recurringEvents.length}
                </p>
                <p className="text-sm text-gray-400">Récurrents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Sword className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {
                    [...upcomingEvents, ...recurringEvents].filter(
                      (e) =>
                        e.type === "ALLIANCE_WAR" ||
                        e.type === "GUERRE_ALLIANCE"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-400">Guerres</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Crown className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {
                    [...upcomingEvents, ...recurringEvents].filter(
                      (e) => e.type === "BOSS_FIGHT"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-400">Boss</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Content */}
      <div className="space-y-4">
        {activeTab === "upcoming" && (
          <div>
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun événement à venir
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Créez votre premier événement pour commencer
                  </p>
                  {hasPermission(session.data, "create_event") && (
                    <Button onClick={handleCreateNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un événement
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === "recurring" && (
          <div>
            {recurringEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Repeat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun événement récurrent
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Les événements récurrents apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recurringEvents.map(renderEventCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === "past" && (
          <div>
            {pastEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun événement passé
                  </h3>
                  <p className="text-muted-foreground">
                    L'historique des événements apparaîtra ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastEvents.map(renderEventCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
