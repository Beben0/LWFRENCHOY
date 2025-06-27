"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Eye, EyeOff, Grip, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ReferenceDataForm } from "./reference-data-form";

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
  createdAt: string;
  updatedAt: string;
}

interface CategoryInfo {
  category: string;
  count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  MEMBER_SPECIALTY: "Spécialités des Membres",
  MEMBER_TAG: "Tags des Membres",
  ALLIANCE_ROLE: "Rôles d'Alliance",
  EVENT_TYPE: "Types d'Événements",
  EVENT_TAG: "Tags des Événements",
  TRAIN_TYPE: "Types de Trains",
  PRIORITY_LEVEL: "Niveaux de Priorité",
  STATUS_TYPE: "Types de Statuts",
};

export function ReferenceDataManager() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [items, setItems] = useState<ReferenceDataItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReferenceDataItem | null>(
    null
  );

  // Charger les catégories au démarrage
  useEffect(() => {
    loadCategories();
  }, []);

  // Charger les éléments quand la catégorie change
  useEffect(() => {
    if (selectedCategory) {
      loadItems();
    }
  }, [selectedCategory, showInactive]);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/admin/reference-data");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].category);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/reference-data?category=${selectedCategory}&includeInactive=${showInactive}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des éléments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormMode("create");
  };

  const handleEdit = (item: ReferenceDataItem) => {
    setSelectedItem(item);
    setFormMode("edit");
  };

  const handleDelete = async (item: ReferenceDataItem) => {
    if (item.isSystem) {
      alert("Impossible de supprimer un élément système");
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.label}" ?`)) {
      try {
        const response = await fetch(
          `/api/admin/reference-data?id=${item.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          loadItems();
        } else {
          const error = await response.json();
          alert(error.error || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleToggleActive = async (item: ReferenceDataItem) => {
    try {
      const response = await fetch("/api/admin/reference-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });

      if (response.ok) {
        loadItems();
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
    }
  };

  const handleFormSubmit = () => {
    setFormMode(null);
    setSelectedItem(null);
    loadItems();
    loadCategories(); // Recharger les compteurs
  };

  const handleFormCancel = () => {
    setFormMode(null);
    setSelectedItem(null);
  };

  if (loading && categories.length === 0) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de catégorie */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.category}
            variant={selectedCategory === cat.category ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.category)}
            className="flex items-center gap-2"
          >
            {CATEGORY_LABELS[cat.category] || cat.category}
            <Badge variant="secondary">{cat.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Contrôles */}
      {selectedCategory && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {CATEGORY_LABELS[selectedCategory] || selectedCategory}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showInactive ? "Masquer inactifs" : "Afficher inactifs"}
            </Button>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      )}

      {/* Liste des éléments */}
      {selectedCategory && (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className={!item.isActive ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Grip className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div className="flex items-center gap-2">
                      {item.color && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-muted-foreground">
                          Clé: {item.key}
                          {item.description && ` • ${item.description}`}
                        </div>
                      </div>
                    </div>
                    {item.isSystem && <Badge variant="outline">Système</Badge>}
                    {!item.isActive && (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(item)}
                    >
                      {item.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {!item.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Aucun élément trouvé pour cette catégorie
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Formulaire */}
      {formMode && (
        <ReferenceDataForm
          mode={formMode}
          category={selectedCategory}
          item={selectedItem}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
