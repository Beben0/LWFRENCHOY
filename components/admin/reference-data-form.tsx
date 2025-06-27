"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import React, { useState } from "react";

interface ReferenceDataItem {
  id: string;
  category: string;
  key: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
}

interface ReferenceDataFormProps {
  mode: "create" | "edit";
  category: string;
  item?: ReferenceDataItem | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ReferenceDataForm({
  mode,
  category,
  item,
  onSubmit,
  onCancel,
}: ReferenceDataFormProps) {
  const [formData, setFormData] = useState({
    key: item?.key || "",
    label: item?.label || "",
    description: item?.description || "",
    color: item?.color || "#3b82f6",
    icon: item?.icon || "",
    isActive: item?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = "/api/admin/reference-data";
      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        ...formData,
        category,
        ...(mode === "edit" && { id: item?.id }),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
          <CardTitle className="text-white">
            {mode === "create" ? "Ajouter" : "Modifier"} un élément
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
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
                Clé *
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleInputChange("key", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ex: sniper, urgent, etc."
                required
                disabled={item?.isSystem}
              />
              <p className="text-xs text-gray-400 mt-1">
                Identifiant unique (sans espaces ni caractères spéciaux)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Libellé *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange("label", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ex: Sniper, Urgent, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Description optionnelle"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Couleur
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className="w-16 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Icône
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleInputChange("icon", e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ex: target, star, crown, etc."
              />
              <p className="text-xs text-gray-400 mt-1">
                Nom de l'icône Lucide (optionnel)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange("isActive", e.target.checked)
                }
                className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-300"
              >
                Actif
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </div>
    </Card>
  );
}
