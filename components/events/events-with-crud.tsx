"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import {
  ReferenceMultiSelect,
  ReferenceSelect,
} from "@/components/forms/reference-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Edit, Plus, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  title: string;
  description?: string;
  type: "ALLIANCE_WAR" | "BOSS_FIGHT" | "SERVER_WAR" | "SEASONAL";
  tags?: string[];
  startDate: Date;
  endDate?: Date;
}

export function EventsWithCrud() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "ALLIANCE_WAR" as Event["type"],
    tags: [] as string[],
    startDate: "",
    endDate: "",
  });

  const [newTag, setNewTag] = useState("");

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Vérifier s'il y a un paramètre edit dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");
    if (editId) {
      setShowForm(true);
      // Récupérer l'événement à éditer
      fetchEventForEdit(editId);
    }
  }, []);

  const fetchEventForEdit = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const event = await response.json();
        setEditingEvent(event);
        setFormData({
          title: event.title,
          description: event.description || "",
          type: event.type,
          tags: event.tags || [],
          startDate: new Date(event.startDate).toISOString().slice(0, 16),
          endDate: event.endDate
            ? new Date(event.endDate).toISOString().slice(0, 16)
            : "",
        });
      }
    } catch (error) {
      console.error("Error fetching event for edit:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingEvent
        ? `/api/events/${editingEvent.id}`
        : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          endDate: formData.endDate || null,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingEvent(null);
        setFormData({
          title: "",
          description: "",
          type: "ALLIANCE_WAR" as Event["type"],
          tags: [],
          startDate: "",
          endDate: "",
        });
        fetchEvents();
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      type: event.type,
      tags: event.tags || [],
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().slice(0, 16)
        : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEvents();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur de connexion");
    }
  };

  const getEventTypeLabel = (type: string) => {
    const types = {
      ALLIANCE_WAR: "Guerre d'Alliance",
      BOSS_FIGHT: "Boss Fight",
      SERVER_WAR: "Guerre de Serveur",
      SEASONAL: "Événement Saisonnier",
    };
    return types[type as keyof typeof types] || type;
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (showForm) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {editingEvent ? "Modifier" : "Nouvel"} Événement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Titre *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Type *
              </label>
              <ReferenceSelect
                category="EVENT_TYPE"
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as any })
                }
                placeholder="Sélectionner un type"
                allowEmpty={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Date/Heure de début *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Date/Heure de fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Tags
              </label>
              <ReferenceMultiSelect
                category="EVENT_TAG"
                values={formData.tags}
                onValuesChange={(values) =>
                  setFormData({ ...formData, tags: values })
                }
                placeholder="Ajouter un tag..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "..." : editingEvent ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Gestion des Événements
          </h1>
          <p className="text-muted-foreground">
            {events.length} événement(s) planifié(s)
          </p>
        </div>

        {/* Bouton d'ajout - Admins seulement */}
        <PermissionGuard permission="create_event">
          <Button
            onClick={() => setShowForm(true)}
            className="lastwar-gradient text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Événement
          </Button>
        </PermissionGuard>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover:bg-accent/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {event.description}
                      </p>
                    )}

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {event.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <span>
                        📅 {new Date(event.startDate).toLocaleString()}
                      </span>
                      {event.endDate && (
                        <span className="ml-4">
                          ➡️ {new Date(event.endDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions - Admins seulement */}
                  <PermissionGuard permissions={["edit_event", "delete_event"]}>
                    <div className="flex gap-1">
                      <PermissionGuard permission="edit_event">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </PermissionGuard>

                      <PermissionGuard permission="delete_event">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))}

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun événement planifié
            </div>
          )}
        </div>
      )}
    </div>
  );
}
