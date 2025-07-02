"use client";

import { UserForm } from "@/components/admin/user-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { AlertTriangle, Edit, Plus, Shield, Trash2, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  pseudo?: string;
  role: "ADMIN" | "MEMBER";
  allianceRole?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Vérifier les permissions
  useEffect(() => {
    if (session && !hasPermission(session, "manage_users")) {
      router.push("/");
      return;
    }
  }, [session, router]);

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des utilisateurs");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission(session, "manage_users")) {
      loadUsers();
    }
  }, [session]);

  // Créer un utilisateur
  const handleCreateUser = async (userData: any) => {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la création");
    }

    await loadUsers();
  };

  // Modifier un utilisateur
  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return;

    // Ne pas envoyer le mot de passe s'il est vide
    const updateData = { ...userData };
    if (!updateData.password) {
      delete updateData.password;
    }

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la modification");
    }

    setEditingUser(null);
    await loadUsers();
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }

    setDeletingUser(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingUser(null);
    }
  };

  if (!hasPermission(session, "manage_users")) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Chargement des utilisateurs...</div>
      </div>
    );
  }

  const activeUsers = users.filter((u) => u.role === "MEMBER").length;
  const adminUsers = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-lastwar-orange" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Gérer les comptes utilisateurs et leurs accès
          </p>
        </div>
        <Button
          className="lastwar-gradient text-black"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-lastwar-green">
                  {users.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total utilisateurs
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-lastwar-orange">
                  {adminUsers}
                </p>
                <p className="text-xs text-muted-foreground">Administrateurs</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {activeUsers}
                </p>
                <p className="text-xs text-muted-foreground">Membres</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      user.role === "ADMIN" ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.email}</h3>
                      {user.pseudo && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {user.pseudo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "ADMIN" ? "Administrateur" : "Membre"}
                      </span>
                      {user.allianceRole && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {user.allianceRole}
                        </span>
                      )}
                      <span>
                        Créé le: {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      {user.updatedAt !== user.createdAt && (
                        <span>
                          Modifié le:{" "}
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  {user.id !== session?.user?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deletingUser === user.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingUser === user.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de création */}
      <UserForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleCreateUser}
      />

      {/* Formulaire d'édition */}
      <UserForm
        user={editingUser || undefined}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUser}
        isEditing={true}
      />
    </div>
  );
}
