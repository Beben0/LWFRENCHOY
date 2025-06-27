"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, RefreshCw, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";

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

      {/* Matrice des permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice des Permissions</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Rôles Admin</Badge>
              <span className="text-muted-foreground">ADMIN, GUEST</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Rôles Alliance</Badge>
              <span className="text-muted-foreground">
                {data.allianceRoles.join(", ")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Permission</th>
                  {allRoles.map((role) => (
                    <th
                      key={role}
                      className="text-center p-2 font-medium min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={
                            data.adminRoles.includes(role)
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {role}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.availablePermissions.map((permission) => (
                  <tr key={permission} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      <div className="flex flex-col">
                        <span>{permission}</span>
                        <span className="text-xs text-muted-foreground">
                          {getPermissionDescription(permission)}
                        </span>
                      </div>
                    </td>
                    {allRoles.map((role) => {
                      const hasPermission =
                        localPermissions[role]?.includes(permission) || false;
                      return (
                        <td
                          key={`${role}-${permission}`}
                          className="p-2 text-center"
                        >
                          <button
                            onClick={() => togglePermission(role, permission)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded"
                            title={`${
                              hasPermission ? "Retirer" : "Ajouter"
                            } la permission ${permission} pour ${role}`}
                          >
                            {hasPermission ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
  const descriptions: Record<string, string> = {
    view_dashboard: "Accès au tableau de bord",
    view_members: "Voir la liste des membres",
    view_trains: "Voir les plannings de trains",
    view_events: "Voir les événements",
    view_stats: "Voir les statistiques",
    view_admin_panel: "Accès au panel admin",
    create_member: "Créer des membres",
    edit_member: "Modifier des membres",
    delete_member: "Supprimer des membres",
    create_train_slot: "Créer des créneaux de train",
    edit_train_slot: "Modifier des créneaux de train",
    delete_train_slot: "Supprimer des créneaux de train",
    create_event: "Créer des événements",
    edit_event: "Modifier des événements",
    delete_event: "Supprimer des événements",
    manage_users: "Gérer les utilisateurs",
    manage_permissions: "Gérer les permissions",
    export_data: "Exporter des données",
    import_data: "Importer des données",
    manage_alerts: "Gérer les alertes",
    manage_notifications: "Gérer les notifications",
  };

  return descriptions[permission] || "Permission spéciale";
}
