"use client";

import {
  ReferenceMultiSelect,
  ReferenceSelect,
} from "@/components/forms/reference-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Member {
  id?: string;
  pseudo: string;
  level: number;
  power: string;
  kills: number;
  specialty?: string;
  allianceRole: string;
  status: "ACTIVE" | "INACTIVE";
  tags: string[];
  notes?: string;
}

interface MemberFormProps {
  member?: Member;
  onClose?: () => void;
}

export function MemberForm({ member, onClose }: MemberFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Member>({
    pseudo: member?.pseudo || "",
    level: member?.level || 1,
    power: member?.power || "0",
    kills: member?.kills || 0,
    specialty: member?.specialty || "",
    allianceRole: member?.allianceRole || "MEMBER",
    status: member?.status || "ACTIVE",
    tags: member?.tags || [],
    notes: member?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = member?.id ? `/api/members/${member.id}` : "/api/members";
      const method = member?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.refresh();
        onClose?.();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!member?.id || !confirm("Supprimer ce membre ?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
        onClose?.();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          <Translate>{member?.id ? "Modifier" : "Nouveau"}</Translate>{" "}
          <Translate>Membre</Translate>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Pseudo</Translate> *
              </label>
              <input
                type="text"
                required
                value={formData.pseudo}
                onChange={(e) =>
                  setFormData({ ...formData, pseudo: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Level</Translate> *
              </label>
              <input
                type="number"
                min="1"
                max="99"
                required
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Power</Translate> *
              </label>
              <input
                type="text"
                required
                placeholder="12500000"
                value={formData.power}
                onChange={(e) =>
                  setFormData({ ...formData, power: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Kills</Translate>
              </label>
              <input
                type="number"
                min="0"
                value={formData.kills}
                onChange={(e) =>
                  setFormData({ ...formData, kills: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Spécialité</Translate>
              </label>
              <ReferenceSelect
                category="MEMBER_SPECIALTY"
                value={formData.specialty}
                onValueChange={(value) =>
                  setFormData({ ...formData, specialty: value })
                }
                placeholder="Sélectionner une spécialité"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Rôle Alliance</Translate>
              </label>
              <ReferenceSelect
                category="ALLIANCE_ROLE"
                value={formData.allianceRole}
                onValueChange={(value) =>
                  setFormData({ ...formData, allianceRole: value as any })
                }
                placeholder="Sélectionner un rôle"
                allowEmpty={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                <Translate>Statut</Translate>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="ACTIVE">
                  <Translate>Actif</Translate>
                </option>
                <option value="INACTIVE">
                  <Translate>Inactif</Translate>
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              <Translate>Tags</Translate>
            </label>
            <ReferenceMultiSelect
              category="MEMBER_TAG"
              values={formData.tags}
              onValuesChange={(values) =>
                setFormData({ ...formData, tags: values })
              }
              placeholder="Ajouter un tag..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              <Translate>Notes</Translate>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>

          <div className="flex justify-between">
            <div>
              {member?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Translate>Supprimer</Translate>
                </Button>
              )}
            </div>

            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                <Translate>Annuler</Translate>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  "..."
                ) : (
                  <Translate>{member?.id ? "Modifier" : "Créer"}</Translate>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
