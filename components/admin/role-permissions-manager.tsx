"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, RefreshCw, Save, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";

interface RolePermissionsData {
  rolePermissions: Record<string, string[]>;
  allianceRoles: string[];
  availablePermissions: string[];
  adminRoles: string[];
}

export function RolePermissionsManager() {
  const [data, setData] = useState<RolePermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [localPermissions, setLocalPermissions] = useState<
    Record<string, string[]>
  >({});

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/roles");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des rôles");
      }
      const roleData = await response.json();
      setData(roleData);
      setLocalPermissions(roleData.rolePermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sauvegarder les changements
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolePermissions: localPermissions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      setSuccess("Permissions sauvegardées avec succès");
      await loadData(); // Recharger pour s'assurer de la cohérence
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setSaving(false);
    }
  };

  // Initialiser les permissions par défaut
  const handleInitializeDefaults = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir initialiser les permissions par défaut ? Cela remplacera les permissions actuelles."
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/roles", {
        method: "PUT",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'initialisation");
      }

      setSuccess("Permissions par défaut initialisées avec succès");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'initialisation"
      );
    } finally {
      setSaving(false);
    }
  };

  // Basculer une permission pour un rôle
  const togglePermission = (roleType: string, permission: string) => {
    setLocalPermissions((prev) => {
      const newPermissions = { ...prev };
      if (!newPermissions[roleType]) {
        newPermissions[roleType] = [];
      }

      if (newPermissions[roleType].includes(permission)) {
        newPermissions[roleType] = newPermissions[roleType].filter(
          (p) => p !== permission
        );
      } else {
        newPermissions[roleType] = [...newPermissions[roleType], permission];
      }

      return newPermissions;
    });
  };

  // Vérifier si des changements ont été effectués
  const hasChanges = () => {
    if (!data) return false;
    return (
      JSON.stringify(localPermissions) !== JSON.stringify(data.rolePermissions)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">
          Erreur lors du chargement des données
        </p>
        <Button onClick={loadData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  const allRoles = [...data.adminRoles, ...data.allianceRoles];

  const permissionGroups = {
    Navigation: [
      "view_dashboard",
      "view_members",
      "view_trains",
      "view_events",
      "view_stats",
      "view_admin_panel",
      "view_help",
      "view_vs",
      "view_desert_storm",
    ],
    "Gestion des Membres": ["create_member", "edit_member", "delete_member"],
    "Gestion des Trains": [
      "create_train_slot",
      "edit_train_slot",
      "delete_train_slot",
    ],
    "Gestion des Événements": ["create_event", "edit_event", "delete_event"],
    "Gestion des Articles d'Aide": [
      "create_help_article",
      "edit_help_article",
      "delete_help_article",
      "publish_help_article",
      "manage_help_categories",
    ],
    "Gestion VS": [
      "view_vs",
      "create_vs_week",
      "edit_vs_week",
      "delete_vs_week",
      "manage_vs_participants",
      "edit_vs_results",
      "edit_vs",
    ],
    "Gestion Desert Storm": [
      "create_desert_storm",
      "edit_desert_storm",
      "delete_desert_storm",
      "manage_desert_storm_participants",
      "edit_desert_storm_results",
    ],
    Administration: [
      "manage_users",
      "manage_permissions",
      "export_data",
      "import_data",
      "manage_alerts",
      "manage_notifications",
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Gestion des Rôles et Permissions
          </h2>
          <p className="text-muted-foreground">
            Configurez les permissions pour chaque rôle administratif et
            d'alliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleInitializeDefaults}
            disabled={saving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tableau des permissions */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">
                    Permission
                  </th>
                  {allRoles.map((role) => (
                    <th
                      key={role}
                      className="py-3 px-4 text-center text-sm font-semibold text-gray-300"
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Object.entries(permissionGroups).map(
                  ([groupName, permissions]) => (
                    <React.Fragment key={groupName}>
                      <tr className="bg-gray-800/50">
                        <td
                          colSpan={allRoles.length + 1}
                          className="py-2 px-4 text-sm font-bold text-gray-200"
                        >
                          {groupName}
                        </td>
                      </tr>
                      {permissions.map((permission) => (
                        <tr key={permission} className="hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-100">
                              {permission}
                            </div>
                            <div className="text-xs text-gray-400">
                              {getPermissionDescription(permission)}
                            </div>
                          </td>
                          {allRoles.map((role) => (
                            <td
                              key={`${role}-${permission}`}
                              className="py-3 px-4 text-center"
                            >
                              <button
                                onClick={() =>
                                  togglePermission(role, permission)
                                }
                                className="inline-flex items-center"
                                aria-label={`Toggle ${permission} for ${role}`}
                              >
                                {localPermissions[role]?.includes(
                                  permission
                                ) ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {hasChanges() && (
        <div className="fixed bottom-4 right-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded shadow-lg">
          <p className="text-sm font-medium">Modifications non sauvegardées</p>
          <p className="text-xs">
            N'oubliez pas de sauvegarder vos changements
          </p>
        </div>
      )}
    </div>
  );
}

// Descriptions des permissions pour une meilleure UX
function getPermissionDescription(permission: string): string {
  switch (permission) {
    // Navigation
    case "view_dashboard":
      return "Voir le dashboard principal";
    case "view_members":
      return "Voir la liste des membres";
    case "view_trains":
      return "Voir les plannings de trains";
    case "view_events":
      return "Voir les événements";
    case "view_stats":
      return "Voir les statistiques";
    case "view_admin_panel":
      return "Accès au panel admin";
    case "view_help":
      return "Voir les articles d'aide";

    // VS
    case "view_vs":
      return "Voir les classements et historiques VS";
    case "create_vs_week":
      return "Créer une nouvelle semaine VS";
    case "edit_vs_week":
      return "Modifier les détails d'une semaine VS";
    case "delete_vs_week":
      return "Supprimer une semaine VS";
    case "manage_vs_participants":
      return "Ajouter/supprimer des participants à un VS";
    case "edit_vs_results":
      return "Modifier les résultats et scores d'un VS";
    case "edit_vs":
      return "Permission générale pour modifier les données VS";

    // Desert Storm
    case "view_desert_storm":
      return "Voir les événements Desert Storm";
    case "create_desert_storm":
      return "Créer de nouveaux événements Desert Storm";
    case "edit_desert_storm":
      return "Modifier les événements Desert Storm";
    case "delete_desert_storm":
      return "Supprimer les événements Desert Storm";
    case "manage_desert_storm_participants":
      return "Gérer les participants aux événements Desert Storm";
    case "edit_desert_storm_results":
      return "Modifier les résultats des événements Desert Storm";

    // Gestion des Membres
    case "create_member":
      return "Créer des membres";
    case "edit_member":
      return "Modifier des membres";
    case "delete_member":
      return "Supprimer des membres";

    // Gestion des Trains
    case "create_train_slot":
      return "Créer des créneaux de train";
    case "edit_train_slot":
      return "Modifier des créneaux de train";
    case "delete_train_slot":
      return "Supprimer des créneaux de train";

    // Gestion des Événements
    case "create_event":
      return "Créer des événements";
    case "edit_event":
      return "Modifier des événements";
    case "delete_event":
      return "Supprimer des événements";

    // Gestion des Articles d'Aide
    case "create_help_article":
      return "Créer des articles d'aide";
    case "edit_help_article":
      return "Modifier des articles d'aide";
    case "delete_help_article":
      return "Supprimer des articles d'aide";
    case "publish_help_article":
      return "Publier des articles d'aide";
    case "manage_help_categories":
      return "Gérer les catégories d'aide";

    // Administration
    case "manage_users":
      return "Gérer les comptes utilisateurs";
    case "manage_permissions":
      return "Gérer les permissions";
    case "export_data":
      return "Exporter des données";
    case "import_data":
      return "Importer des données";
    case "manage_alerts":
      return "Gérer les alertes";
    case "manage_notifications":
      return "Gérer les notifications";

    default:
      return "Description non disponible";
  }
}
