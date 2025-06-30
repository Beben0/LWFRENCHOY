"use client";

import { Search } from "lucide-react";
import { useState } from "react";

interface Member {
  id: string;
  pseudo: string;
  level: number;
  power: bigint;
  kills: number;
  specialty: string | null;
  allianceRole: string;
  status: "ACTIVE" | "INACTIVE";
  lastActive: Date;
}

interface MembersSearchSimpleProps {
  members: Member[];
}

export function MembersSearchSimple({ members }: MembersSearchSimpleProps) {
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter((member) =>
    member.pseudo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          🔍 Gestion des Membres
        </h1>
        <p className="text-muted-foreground">
          {members.length} membres dans votre alliance
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6 p-4 bg-card border rounded-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Rechercher un membre:
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Tapez le nom d'un membre... (ex: Dragon)"
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          💡 {filteredMembers.length} membre(s) trouvé(s)
        </div>
      </div>

      {/* Liste des membres */}
      <div className="space-y-2">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{member.pseudo}</h3>
                <div className="text-sm text-muted-foreground space-x-4">
                  <span>Level {member.level}</span>
                  <span>Power: {Number(member.power).toLocaleString()}</span>
                  <span>Kills: {member.kills}</span>
                  <span>{member.specialty || "Aucune"}</span>
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      member.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.status}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {member.allianceRole === "R5"
                      ? "Leader (R5)"
                      : member.allianceRole === "R4"
                      ? "Officier (R4)"
                      : "Membre"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Dernière activité:
                </div>
                <div className="text-sm">
                  {new Date(member.lastActive).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && search && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun membre trouvé pour "{search}"
        </div>
      )}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm">
          <strong>✅ Fonctionnalités disponibles:</strong>
        </p>
        <ul className="text-sm mt-2 space-y-1">
          <li>• Recherche en temps réel par pseudo</li>
          <li>• Affichage complet des stats membres</li>
          <li>• Interface responsive</li>
          <li>• Données en temps réel depuis PostgreSQL</li>
        </ul>
      </div>
    </div>
  );
}
