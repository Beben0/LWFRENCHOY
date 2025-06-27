"use client";

import {
  ReferenceMultiSelect,
  ReferenceSelect,
} from "@/components/forms/reference-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  Plus,
  Repeat,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EventFormData {
  title: string;
  description: string;
  detailedDescription: string;
  type: string;
  tags: string[];
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  recurringDays: number[];
  recurringEndDate: string;
}

interface EventFormProps {
  event?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
  { value: 0, label: "Dimanche", short: "Dim" },
];

export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    description: event?.description || "",
    detailedDescription: event?.detailedDescription || "",
    type: event?.type || "",
    tags: event?.tags || [],
    startDate: event?.startDate
      ? new Date(event.startDate).toISOString().slice(0, 16)
      : "",
    endDate: event?.endDate
      ? new Date(event.endDate).toISOString().slice(0, 16)
      : "",
    isRecurring: event?.isRecurring || false,
    recurringDays: event?.recurringDays || [],
    recurringEndDate: event?.recurringEndDate
      ? new Date(event.recurringEndDate).toISOString().slice(0, 16)
      : "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.type) {
      newErrors.type = "Le type d'événement est requis";
    }

    if (!formData.startDate) {
      newErrors.startDate = "La date de début est requise";
    }

    if (
      formData.endDate &&
      formData.startDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      newErrors.endDate = "La date de fin doit être après la date de début";
    }

    if (formData.isRecurring) {
      if (formData.recurringDays.length === 0) {
        newErrors.recurringDays =
          "Sélectionnez au moins un jour pour la récurrence";
      }
      if (!formData.recurringEndDate) {
        newErrors.recurringEndDate = "La date de fin de récurrence est requise";
      } else if (
        new Date(formData.recurringEndDate) <= new Date(formData.startDate)
      ) {
        newErrors.recurringEndDate =
          "La date de fin de récurrence doit être après la date de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PUT" : "POST";

      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        recurringEndDate: formData.recurringEndDate
          ? new Date(formData.recurringEndDate).toISOString()
          : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSave?.();
        if (!event) {
          // Nouveau événement créé, rediriger vers la liste
          router.push("/events");
        }
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Erreur lors de la sauvegarde"}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleRecurringDay = (dayValue: number) => {
    const newDays = formData.recurringDays.includes(dayValue)
      ? formData.recurringDays.filter((d) => d !== dayValue)
      : [...formData.recurringDays, dayValue].sort();

    handleInputChange("recurringDays", newDays);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {event ? (
            <>
              <FileText className="w-5 h-5" />
              Modifier l'événement
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Nouvel événement
            </>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.title ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Titre de l'événement"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type d'événement *
                </label>
                <ReferenceSelect
                  category="EVENT_TYPE"
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                  placeholder="Sélectionner le type..."
                  allowEmpty={false}
                  className={errors.type ? "border-red-500" : ""}
                />
                {errors.type && (
                  <p className="mt-1 text-sm text-red-400">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description courte
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Description courte de l'événement"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <ReferenceMultiSelect
                  category="EVENT_TAG"
                  values={formData.tags}
                  onValuesChange={(values) => handleInputChange("tags", values)}
                  placeholder="Ajouter des tags..."
                />
              </div>
            </div>
          </div>

          {/* Description détaillée */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description détaillée
            </label>
            <textarea
              value={formData.detailedDescription}
              onChange={(e) =>
                handleInputChange("detailedDescription", e.target.value)
              }
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Description détaillée avec instructions, objectifs, récompenses..."
            />
          </div>

          {/* Dates et heures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date et heure de début *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.startDate ? "border-red-500" : "border-gray-600"
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Date et heure de fin
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.endDate ? "border-red-500" : "border-gray-600"
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Récurrence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  handleInputChange("isRecurring", e.target.checked)
                }
                className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
              />
              <label
                htmlFor="isRecurring"
                className="text-sm font-medium text-gray-300 flex items-center gap-1"
              >
                <Repeat className="w-4 h-4" />
                Événement récurrent
              </label>
            </div>

            {formData.isRecurring && (
              <div className="ml-6 space-y-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CalendarDays className="w-4 h-4 inline mr-1" />
                    Jours de récurrence *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleRecurringDay(day.value)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          formData.recurringDays.includes(day.value)
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {errors.recurringDays && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.recurringDays}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de fin de récurrence *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.recurringEndDate}
                    onChange={(e) =>
                      handleInputChange("recurringEndDate", e.target.value)
                    }
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.recurringEndDate
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                  />
                  {errors.recurringEndDate && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.recurringEndDate}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={loading}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Sauvegarde..." : event ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
