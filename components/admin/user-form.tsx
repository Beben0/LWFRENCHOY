"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface AllianceRole {
  key: string;
  label: string;
}

interface User {
  id?: string;
  email: string;
  pseudo?: string;
  role: "ADMIN" | "MEMBER";
  allianceRole?: string;
  password?: string;
}

interface UserFormProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => Promise<void>;
  isEditing?: boolean;
}

export function UserForm({
  user,
  isOpen,
  onClose,
  onSave,
  isEditing = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    email: user?.email || "",
    pseudo: user?.pseudo || "",
    role: user?.role || "MEMBER",
    allianceRole: user?.allianceRole || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allianceRoles, setAllianceRoles] = useState<AllianceRole[]>([]);

  // Charger les rôles d'alliance depuis le référentiel
  useEffect(() => {
    const fetchAllianceRoles = async () => {
      try {
        const response = await fetch(
          "/api/admin/reference-data?category=ALLIANCE_ROLE"
        );
        if (response.ok) {
          const data = await response.json();
          setAllianceRoles(
            data.map((item: any) => ({
              key: item.key,
              label: item.label,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching alliance roles:", error);
      }
    };

    if (isOpen) {
      fetchAllianceRoles();
    }
  }, [isOpen]);

  // Mettre à jour les données du formulaire quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        pseudo: user.pseudo || "",
        role: user.role,
        allianceRole: user.allianceRole || "",
        password: "",
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation basique
      if (!formData.email || !formData.email.includes("@")) {
        throw new Error("Email invalide");
      }

      if (!isEditing && !formData.password) {
        throw new Error("Mot de passe requis pour un nouvel utilisateur");
      }

      if (formData.password && formData.password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      // Préparer les données à sauvegarder
      const dataToSave = { ...formData };
      if (!dataToSave.allianceRole) {
        dataToSave.allianceRole = undefined;
      }

      await onSave(dataToSave);
      onClose();
      setFormData({
        email: "",
        pseudo: "",
        role: "MEMBER",
        allianceRole: "",
        password: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-gray-700">
          <CardTitle className="text-white">
            {isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 text-red-300 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="user@alliance.gg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Pseudo (optionnel)
              </label>
              <input
                type="text"
                value={formData.pseudo}
                onChange={(e) =>
                  setFormData({ ...formData, pseudo: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="DragonSlayer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Rôle administratif
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "ADMIN" | "MEMBER",
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="MEMBER">Membre</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Rôle d'alliance (optionnel)
              </label>
              <select
                value={formData.allianceRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allianceRole: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Aucun rôle d'alliance</option>
                {allianceRoles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                {isEditing
                  ? "Nouveau mot de passe (optionnel)"
                  : "Mot de passe"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={
                  isEditing
                    ? "Laisser vide pour ne pas changer"
                    : "Minimum 6 caractères"
                }
                required={!isEditing}
                minLength={6}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
