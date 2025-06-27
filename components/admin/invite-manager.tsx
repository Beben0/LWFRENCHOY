"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface InviteLink {
  id: string;
  token: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  usedBy: string[];
  createdAt: string;
}

export default function InviteManager() {
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    maxUses: "",
    expiresInHours: "",
  });

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const response = await fetch("/api/admin/invites");
      if (response.ok) {
        const data = await response.json();
        setInvites(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      const data: any = {};
      if (createForm.maxUses) data.maxUses = parseInt(createForm.maxUses);
      if (createForm.expiresInHours)
        data.expiresInHours = parseInt(createForm.expiresInHours);

      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setCreateForm({ maxUses: "", expiresInHours: "" });
        setShowCreateForm(false);
        loadInvites();
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'invitation:", error);
    }
  };

  const deleteInvite = async (token: string) => {
    if (!confirm("Êtes-vous sûr de vouloir désactiver cette invitation ?"))
      return;

    try {
      const response = await fetch(`/api/admin/invites/${token}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadInvites();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'invitation:", error);
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/register/${token}`;
    navigator.clipboard.writeText(url);
    alert("Lien d'invitation copié !");
  };

  const openInviteLink = (token: string) => {
    const url = `${window.location.origin}/register/${token}`;
    window.open(url, "_blank");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt?: string): boolean => {
    return !!(expiresAt && new Date(expiresAt) < new Date());
  };

  const isExhausted = (invite: InviteLink): boolean => {
    return !!(invite.maxUses && invite.usedCount >= invite.maxUses);
  };

  const getStatusBadge = (invite: InviteLink) => {
    if (!invite.isActive) {
      return (
        <Badge variant="outline" className="text-gray-500">
          Désactivé
        </Badge>
      );
    }
    if (isExpired(invite.expiresAt)) {
      return (
        <Badge variant="outline" className="text-orange-500">
          Expiré
        </Badge>
      );
    }
    if (isExhausted(invite)) {
      return (
        <Badge variant="outline" className="text-yellow-500">
          Épuisé
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-green-500">
        Actif
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Liens d'invitation</h1>
          <p className="text-muted-foreground">
            Gérez les liens d'invitation pour permettre aux nouveaux membres de
            s'inscrire
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau lien
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau lien d'invitation</CardTitle>
            <CardDescription>
              Configurez les paramètres du lien d'invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre d'utilisations max (optionnel)
                </label>
                <input
                  type="number"
                  min="1"
                  value={createForm.maxUses}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, maxUses: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  placeholder="Illimité"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Expire dans (heures, optionnel)
                </label>
                <input
                  type="number"
                  min="1"
                  max="8760"
                  value={createForm.expiresInHours}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      expiresInHours: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                  placeholder="Jamais"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={createInvite}
                className="bg-red-600 hover:bg-red-700"
              >
                Créer le lien
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Chargement des invitations...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Aucun lien d'invitation créé
                </p>
              </CardContent>
            </Card>
          ) : (
            invites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-800 px-2 py-1 rounded text-sm">
                          {invite.token.substring(0, 8)}...
                        </code>
                        {getStatusBadge(invite)}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Créé le: {formatDateTime(invite.createdAt)}</p>

                        <div className="flex gap-4">
                          {invite.maxUses ? (
                            <span>
                              Utilisations: {invite.usedCount}/{invite.maxUses}
                            </span>
                          ) : (
                            <span>
                              Utilisations: {invite.usedCount} (illimité)
                            </span>
                          )}

                          {invite.expiresAt && (
                            <span>
                              Expire le: {formatDateTime(invite.expiresAt)}
                            </span>
                          )}
                        </div>

                        {invite.usedBy.length > 0 && (
                          <div>
                            <p className="font-medium">Utilisé par:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {invite.usedBy.map((email, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {email}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(invite.token)}
                        disabled={
                          !invite.isActive ||
                          isExpired(invite.expiresAt) ||
                          isExhausted(invite)
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInviteLink(invite.token)}
                        disabled={
                          !invite.isActive ||
                          isExpired(invite.expiresAt) ||
                          isExhausted(invite)
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteInvite(invite.token)}
                        disabled={!invite.isActive}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
