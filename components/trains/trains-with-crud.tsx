"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Plus, Train, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TrainSlot {
  id: string;
  day: string;
  timeSlot: string;
  memberId?: string;
  member?: {
    id: string;
    pseudo: string;
  };
}

interface Member {
  id: string;
  pseudo: string;
}

export function TrainsWithCrud() {
  const [trainSlots, setTrainSlots] = useState<TrainSlot[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TrainSlot | null>(null);

  const [formData, setFormData] = useState({
    day: "MONDAY",
    timeSlot: "08:00",
    memberId: "",
  });

  const fetchData = async () => {
    try {
      const [trainsResponse, membersResponse] = await Promise.all([
        fetch("/api/trains"),
        fetch("/api/members"),
      ]);

      if (trainsResponse.ok) {
        const trainsData = await trainsResponse.json();
        setTrainSlots(trainsData.trainSlots || []);
      }

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingSlot ? `/api/trains/${editingSlot.id}` : "/api/trains";
      const method = editingSlot ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingSlot(null);
        setFormData({ day: "MONDAY", timeSlot: "08:00", memberId: "" });
        fetchData();
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot: TrainSlot) => {
    setEditingSlot(slot);
    setFormData({
      day: slot.day,
      timeSlot: slot.timeSlot,
      memberId: slot.memberId || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;

    try {
      const response = await fetch(`/api/trains/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur de connexion");
    }
  };

  const handleValidate = async (id: string, isValidated: boolean) => {
    try {
      const response = await fetch(`/api/trains/${id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isValidated }),
      });

      if (response.ok) {
        fetchData();
        alert(`Train ${isValidated ? "validé" : "invalidé"} avec succès !`);
      } else {
        alert("Erreur lors de la validation");
      }
    } catch (error) {
      alert("Erreur de connexion");
    }
  };

  const getDayLabel = (day: string) => {
    const days = {
      MONDAY: "Lundi",
      TUESDAY: "Mardi",
      WEDNESDAY: "Mercredi",
      THURSDAY: "Jeudi",
      FRIDAY: "Vendredi",
      SATURDAY: "Samedi",
      SUNDAY: "Dimanche",
    };
    return days[day as keyof typeof days] || day;
  };

  if (showForm) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {editingSlot ? "Modifier" : "Nouveau"} Créneau Train
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Jour *
                </label>
                <select
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="MONDAY">Lundi</option>
                  <option value="TUESDAY">Mardi</option>
                  <option value="WEDNESDAY">Mercredi</option>
                  <option value="THURSDAY">Jeudi</option>
                  <option value="FRIDAY">Vendredi</option>
                  <option value="SATURDAY">Samedi</option>
                  <option value="SUNDAY">Dimanche</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Heure *
                </label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) =>
                    setFormData({ ...formData, timeSlot: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="08:00">08:00</option>
                  <option value="12:00">12:00</option>
                  <option value="14:00">14:00</option>
                  <option value="18:00">18:00</option>
                  <option value="20:00">20:00</option>
                  <option value="22:00">22:00</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Conducteur
              </label>
              <select
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Aucun (créneau libre)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.pseudo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingSlot(null);
                }}
              >
                Annuler
              </Button>

              {editingSlot && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      await handleValidate(editingSlot.id, true);
                      setShowForm(false);
                      setEditingSlot(null);
                    }}
                    disabled={loading}
                  >
                    ✓ Valider sans modifier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={async () => {
                      await handleValidate(editingSlot.id, false);
                      setShowForm(false);
                      setEditingSlot(null);
                    }}
                    disabled={loading}
                  >
                    ✗ Invalider
                  </Button>
                </>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "..." : editingSlot ? "Modifier" : "Créer"}
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
            <Train className="w-8 h-8" />
            Planning des Trains
          </h1>
          <p className="text-muted-foreground">
            {trainSlots.length} créneaux planifiés
          </p>
        </div>

        {/* Bouton d'ajout - Admins seulement */}
        <PermissionGuard permission="create_train_slot">
          <Button
            onClick={() => setShowForm(true)}
            className="lastwar-gradient text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Créneau
          </Button>
        </PermissionGuard>
      </div>

      {/* Train Slots List */}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {trainSlots.map((slot) => (
            <Card
              key={slot.id}
              className="hover:bg-accent/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        🚂 {getDayLabel(slot.day)} à {slot.timeSlot}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          slot.member
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {slot.member ? "Assigné" : "Libre"}
                      </span>
                    </div>

                    {slot.member ? (
                      <p className="text-sm text-muted-foreground">
                        👤 Conducteur: <strong>{slot.member.pseudo}</strong>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Aucun conducteur assigné
                      </p>
                    )}
                  </div>

                  {/* Actions - Admins seulement */}
                  <PermissionGuard
                    permissions={["edit_train_slot", "delete_train_slot"]}
                  >
                    <div className="flex gap-1">
                      <PermissionGuard permission="edit_train_slot">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(slot)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </PermissionGuard>

                      <PermissionGuard permission="delete_train_slot">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(slot.id)}
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

          {trainSlots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun créneau de train planifié
            </div>
          )}
        </div>
      )}
    </div>
  );
}
