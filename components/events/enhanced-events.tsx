"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  title: string;
  description?: string;
  detailedDescription?: string;
  type: string;
  tags: string[];
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  recurringDays: string[];
  recurringEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Lundi", short: "Lun" },
  { key: "tuesday", label: "Mardi", short: "Mar" },
  { key: "wednesday", label: "Mercredi", short: "Mer" },
  { key: "thursday", label: "Jeudi", short: "Jeu" },
  { key: "friday", label: "Vendredi", short: "Ven" },
  { key: "saturday", label: "Samedi", short: "Sam" },
  { key: "sunday", label: "Dimanche", short: "Dim" },
];

const EVENT_TYPES = [
  { value: "GUERRE_ALLIANCE", label: "Guerre d'Alliance" },
  { value: "BOSS_FIGHT", label: "Boss Fight" },
  { value: "EVENT_SPECIAL", label: "Event Spécial" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "FORMATION", label: "Formation" },
  { value: "REUNION", label: "Réunion" },
  { value: "ALLIANCE_WAR", label: "Alliance War" },
  { value: "SERVER_WAR", label: "Server War" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "AUTRE", label: "Autre" },
];

export function EnhancedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    detailedDescription: "",
    type: "EVENT_SPECIAL",
    tags: [] as string[],
    startDate: "",
    endDate: "",
    isRecurring: false,
    recurringDays: [] as string[],
    recurringEndDate: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
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
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate
            ? new Date(formData.endDate).toISOString()
            : null,
          recurringEndDate: formData.recurringEndDate
            ? new Date(formData.recurringEndDate).toISOString()
            : null,
        }),
      });

      if (response.ok) {
        await fetchEvents();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      detailedDescription: event.detailedDescription || "",
      type: event.type,
      tags: event.tags || [],
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().slice(0, 16)
        : "",
      isRecurring: event.isRecurring,
      recurringDays: event.recurringDays || [],
      recurringEndDate: event.recurringEndDate
        ? new Date(event.recurringEndDate).toISOString().slice(0, 16)
        : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      detailedDescription: "",
      type: "EVENT_SPECIAL",
      tags: [],
      startDate: "",
      endDate: "",
      isRecurring: false,
      recurringDays: [],
      recurringEndDate: "",
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const toggleRecurringDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day],
    }));
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Événements Avancés</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion complète des événements avec descriptions détaillées et
            répétitions
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Événement
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
            </h2>
            <Button variant="outline" onClick={resetForm}>
              Annuler
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Type d'événement
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description courte
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                placeholder="Résumé en une ligne..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description détaillée
              </label>
              <textarea
                value={formData.detailedDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detailedDescription: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                rows={4}
                placeholder="Description complète avec détails, objectifs, règles..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de début *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                />
              </div>
            </div>

            {/* Récurrence */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isRecurring: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="recurring" className="text-sm font-medium">
                  <Repeat className="h-4 w-4 inline mr-1" />
                  Événement répétitif
                </label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Jours de la semaine
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleRecurringDay(day.key)}
                          className={`px-3 py-1 text-sm rounded ${
                            formData.recurringDays.includes(day.key)
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Fin de la récurrence
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.recurringEndDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurringEndDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <input
                type="text"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                placeholder="Appuyez sur Entrée pour ajouter un tag..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "..." : editingEvent ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Events List */}
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  {event.isRecurring && (
                    <Badge variant="outline">
                      <Repeat className="h-3 w-3 mr-1" />
                      Répétitif
                    </Badge>
                  )}
                  <Badge>{event.type}</Badge>
                </div>

                {event.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {event.description}
                  </p>
                )}

                {event.detailedDescription && (
                  <details className="mb-3">
                    <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Description détaillée
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm whitespace-pre-wrap">
                      {event.detailedDescription}
                    </div>
                  </details>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDateTime(event.startDate)}
                  </span>
                  {event.endDate && (
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Fin: {formatDateTime(event.endDate)}
                    </span>
                  )}
                </div>

                {event.isRecurring && event.recurringDays.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.recurringDays.map((day) => {
                      const dayInfo = DAYS_OF_WEEK.find((d) => d.key === day);
                      return (
                        <Badge key={day} variant="outline" className="text-xs">
                          {dayInfo?.short}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {event.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(event)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(event)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {events.length === 0 && (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Aucun événement
            </h3>
            <p className="text-gray-400 mb-4">
              Créez votre premier événement pour commencer
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un événement
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
