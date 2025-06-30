"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUserPermissions,
  getUserRole,
  hasPermission,
  type Permission,
} from "@/lib/permissions";
import {
  BarChart3,
  Calendar,
  Database,
  Edit,
  Plus,
  Settings,
  Shield,
  Train,
  Trash2,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function TestPermissionsPage() {
  const { data: session } = useSession();
  const userRole = getUserRole(session);
  const userPermissions = getUserPermissions(session);

  const [members, setMembers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const [mockPermissions, setMockPermissions] = useState<string[]>([]);

  // Load members (first 500)
  useEffect(() => {
    fetch("/api/members?limit=500")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => {});
  }, []);

  const handleSelect = (e: any) => {
    const id = e.target.value;
    setSelectedId(id);
    const m = members.find((m: any) => m.id === id);
    setSelectedMember(m || null);
  };

  // Fetch permissions via API to get alliance role permissions too
  const fetchPermissions = async (session: any) => {
    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });
      const data = await response.json();
      return data.permissions || [];
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
  };

  // Create mock session for selected member
  const createMockSession = (member: any) => {
    if (!member) return null;
    return {
      user: {
        id: member.userId || "mock",
        email: member.email,
        role: member.user?.role || "GUEST", // Use real role from user relation
        member: {
          id: member.id,
          pseudo: member.pseudo,
          allianceRole: member.allianceRole,
          power: member.power,
        },
      },
      expires: new Date().toISOString(),
    };
  };

  const mockSession = selectedMember ? createMockSession(selectedMember) : null;

  // Update permissions when session changes
  useEffect(() => {
    if (selectedMember) {
      const session = createMockSession(selectedMember);
      if (session) {
        fetchPermissions(session).then(setMockPermissions);
      }
    } else {
      setMockPermissions([]);
    }
  }, [selectedMember?.id]);

  // Helper to check mock permission
  const mockCan = (perm: Permission) => mockPermissions.includes(perm);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-8 h-8 text-lastwar-orange" />
          Test du Système de Permissions
        </h1>
        <p className="text-muted-foreground">
          Démonstration des contrôles d'accès selon les rôles
        </p>
      </div>

      {/* Informations utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Statut :</strong> {session ? "Connecté" : "Non connecté"}
            </div>
            <div>
              <strong>Email :</strong> {session?.user?.email || "Aucun"}
            </div>
            <div>
              <strong>Rôle :</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  userRole === "ADMIN"
                    ? "bg-red-100 text-red-800"
                    : userRole === "GUEST"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {userRole}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <strong>Permissions ({userPermissions.length}) :</strong>
            <div className="mt-2 flex flex-wrap gap-1">
              {userPermissions.map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tester un membre particulier */}
      <Card>
        <CardHeader>
          <CardTitle>Tester un membre spécifique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm">Sélectionner un membre</label>
            <select
              className="mt-1 w-full border rounded p-2 bg-card"
              value={selectedId}
              onChange={handleSelect}
            >
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.pseudo || m.email} ({m.allianceRole || ""})
                </option>
              ))}
            </select>
          </div>
          {selectedMember && (
            <div className="space-y-4">
              <div className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded border">
                <p>
                  <strong>Pseudo:</strong> {selectedMember.pseudo}
                </p>
                <p>
                  <strong>Email:</strong> {selectedMember.email}
                </p>
                <p>
                  <strong>Rôle Alliance:</strong>{" "}
                  {selectedMember.allianceRole || "MEMBER"}
                </p>
                <p>
                  <strong>Power:</strong>{" "}
                  {selectedMember.power?.toLocaleString()}
                </p>
                <p>
                  <strong>Rôle Système:</strong> {mockSession?.user.role}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Permissions de ce membre ({mockPermissions?.length || 0})
                </h3>
                <div className="mb-2 text-sm text-gray-600">
                  Rôle système:{" "}
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    {mockSession?.user.role}
                  </span>
                  {" | "}
                  Rôle alliance:{" "}
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    {selectedMember?.allianceRole}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockPermissions?.map((permission) => (
                    <span
                      key={permission}
                      className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>

              {/* What can this member see/do? */}
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Ce que ce membre peut voir
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("view_dashboard")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("view_dashboard")
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    Dashboard
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("view_members")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("view_members") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Membres
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("view_trains") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("view_trains") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Trains
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("view_events") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("view_events") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Événements
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("view_vs") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("view_vs") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    VS Wars
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("view_stats") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("view_stats") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Stats
                  </div>
                </div>
              </div>

              {/* Actions this member can do */}
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Actions possibles
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("edit_event") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("edit_event") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Planifier événements
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("edit_train_slot")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("edit_train_slot")
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    Gérer trains
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("edit_vs") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("edit_vs") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Gérer VS
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("manage_users")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("manage_users") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Gestion utilisateurs
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("manage_permissions")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("manage_permissions")
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    Gestion permissions
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      mockCan("export_data") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mockCan("export_data") ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    Export/Import données
                  </div>
                </div>
              </div>

              {/* Dashboard sections this member would see */}
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Sections Dashboard visibles
                </h4>
                <div className="text-xs space-y-1">
                  {mockCan("view_events") && (
                    <div className="text-green-600">✅ Événements & Trains</div>
                  )}
                  {mockCan("view_vs") && (
                    <div className="text-green-600">
                      ✅ VS (Guerre d'alliance)
                    </div>
                  )}
                  {mockCan("view_members") && (
                    <div className="text-green-600">✅ Membres</div>
                  )}
                  {mockCan("manage_alerts") && (
                    <div className="text-green-600">✅ Outils & Scheduler</div>
                  )}
                  {(mockCan("manage_users") ||
                    mockCan("manage_permissions")) && (
                    <div className="text-green-600">✅ Administration</div>
                  )}
                  {mockCan("view_help") && (
                    <div className="text-green-600">✅ Aide & Docs</div>
                  )}

                  {/* Show if they can't see anything */}
                  {!mockCan("view_dashboard") && (
                    <div className="text-red-600">
                      ❌ Aucun accès au dashboard
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation - Test d'affichage conditionnel */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Conditionnelle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ces éléments de navigation s'affichent selon vos permissions :
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PermissionGuard permission="view_dashboard">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="view_members">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Membres
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="view_trains" showForGuests>
              <Button variant="outline" className="w-full justify-start">
                <Train className="w-4 h-4 mr-2" />
                Trains (Public)
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="view_events">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Événements
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="view_stats">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistiques
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="view_admin_panel">
              <Button
                variant="outline"
                className="w-full justify-start text-lastwar-orange"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </PermissionGuard>
          </div>
        </CardContent>
      </Card>

      {/* Actions CRUD - Test de protection */}
      <Card>
        <CardHeader>
          <CardTitle>Actions CRUD Protégées par Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Les boutons ci-dessous apparaissent uniquement si votre session
            possède la permission requise (
            <code>create_* / edit_* / delete_*</code>). Les rôles d'alliance
            (R4/R5) ou <code>ADMIN</code> disposent généralement de ces droits,
            mais ils peuvent être accordés individuellement par le gestionnaire
            de rôles.
          </p>

          <div className="space-y-4">
            {/* Actions Membres */}
            <div className="border rounded p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Gestion des Membres
              </h4>
              <div className="flex gap-2">
                <PermissionGuard permission="create_member">
                  <Button size="sm" className="lastwar-gradient text-black">
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="edit_member">
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="delete_member">
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </PermissionGuard>
              </div>
            </div>

            {/* Actions Trains */}
            <div className="border rounded p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Train className="w-4 h-4" />
                Gestion des Trains
              </h4>
              <div className="flex gap-2">
                <PermissionGuard permission="create_train_slot">
                  <Button size="sm" className="lastwar-gradient text-black">
                    <Plus className="w-3 h-3 mr-1" />
                    Créer Créneau
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="edit_train_slot">
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="delete_train_slot">
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </PermissionGuard>
              </div>
            </div>

            {/* Actions Événements */}
            <div className="border rounded p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Gestion des Événements
              </h4>
              <div className="flex gap-2">
                <PermissionGuard permission="create_event">
                  <Button size="sm" className="lastwar-gradient text-black">
                    <Plus className="w-3 h-3 mr-1" />
                    Créer Événement
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="edit_event">
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="delete_event">
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités nécessitant les permissions d'administration */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités Avancées (Administration)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cette section requiert des permissions d'administration (
            <code>manage_permissions</code>, <code>export_data</code>, …). Elle
            est donc visible pour les rôles disposant de ces droits (ex :{" "}
            <strong>ADMIN</strong>, <strong>R4</strong>, <strong>R5</strong>, ou
            tout rôle personnalisé auquel on a accordé ces permissions).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PermissionGuard permission="manage_permissions">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Gestion des Permissions
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="export_data">
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Export des Données
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="import_data">
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Import des Données
              </Button>
            </PermissionGuard>

            <PermissionGuard permission="view_admin_panel">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Configuration Système
              </Button>
            </PermissionGuard>
          </div>

          <PermissionGuard
            permission="view_admin_panel"
            fallback={
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm">
                  ⚠️ Vous n'avez pas accès aux fonctionnalités d'administration.
                  Seuls les R4 et R5 peuvent accéder à cette section.
                </p>
              </div>
            }
          >
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">
                ✅ Vous avez accès complet aux fonctionnalités d'administration
                !
              </p>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>

      {/* Tests spécifiques */}
      <Card>
        <CardHeader>
          <CardTitle>Tests de Permissions Spécifiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  hasPermission(session, "view_dashboard")
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span>
                Accès Dashboard :{" "}
                {hasPermission(session, "view_dashboard")
                  ? "✅ Autorisé"
                  : "❌ Refusé"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  hasPermission(session, "create_member")
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span>
                Créer Membre :{" "}
                {hasPermission(session, "create_member")
                  ? "✅ Autorisé"
                  : "❌ Refusé"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  hasPermission(session, "view_admin_panel")
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span>
                Panel Admin :{" "}
                {hasPermission(session, "view_admin_panel")
                  ? "✅ Autorisé"
                  : "❌ Refusé"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  hasPermission(session, "view_trains")
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span>
                Planning Trains :{" "}
                {hasPermission(session, "view_trains")
                  ? "✅ Autorisé"
                  : "❌ Refusé"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
