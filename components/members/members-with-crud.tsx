"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { MemberForm } from "./member-form";

interface MemberFormData {
  id?: string;
  pseudo: string;
  level: number;
  power: string;
  kills: number;
  specialty?: string;
  allianceRole: "R5" | "R4" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  tags: string[];
  notes?: string;
}

interface Member {
  id: string;
  pseudo: string;
  level: number;
  power: bigint;
  kills: number;
  specialty: string | null;
  allianceRole: "R5" | "R4" | "MEMBER";
  status: "ACTIVE" | "INACTIVE";
  tags: string[];
  notes: string | null;
  lastActive: Date;
}

export function MembersWithCrud() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<
    MemberFormData | undefined
  >(undefined);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/members?search=${search}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const filteredMembers = members.filter((member) =>
    member.pseudo.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (member: Member) => {
    setEditingMember({
      id: member.id,
      pseudo: member.pseudo,
      level: member.level,
      power: String(member.power), // Convert BigInt to string for form
      kills: member.kills,
      specialty: member.specialty || undefined,
      allianceRole: member.allianceRole,
      status: member.status,
      tags: member.tags,
      notes: member.notes || undefined,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce membre ?")) return;

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMembers();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur de connexion");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMember(undefined);
    fetchMembers();
  };

  if (showForm) {
    return <MemberForm member={editingMember} onClose={handleFormClose} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestion des Membres
          </h1>
          <p className="text-muted-foreground">
            {members.length} membres dans votre alliance
          </p>
        </div>

        {/* Bouton d'ajout - Admins seulement */}
        <PermissionGuard permission="create_member">
          <Button
            onClick={() => setShowForm(true)}
            className="lastwar-gradient text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Membre
          </Button>
        </PermissionGuard>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredMembers.length} membre(s) trouvé(s)
          </p>
        </CardContent>
      </Card>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="hover:bg-accent/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{member.pseudo}</h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          member.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {member.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.allianceRole === "R5"
                          ? "Leader (R5)"
                          : member.allianceRole === "R4"
                          ? "Officier (R4)"
                          : "Membre"}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground space-x-4">
                      <span>Level {member.level}</span>
                      <span>
                        Power: {Number(member.power).toLocaleString()}
                      </span>
                      <span>Kills: {member.kills}</span>
                      <span>{member.specialty || "Aucune spécialité"}</span>
                    </div>

                    {member.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        {member.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                      Dernière activité:
                      <br />
                      {new Date(member.lastActive).toLocaleDateString()}
                    </div>

                    {/* Actions - Admins seulement */}
                    <PermissionGuard
                      permissions={["edit_member", "delete_member"]}
                    >
                      <div className="flex gap-1">
                        <PermissionGuard permission="edit_member">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </PermissionGuard>

                        <PermissionGuard permission="delete_member">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </PermissionGuard>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredMembers.length === 0 && search && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun membre trouvé pour "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
