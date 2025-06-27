"use client";

import { Button } from "@/components/ui/button";
import { formatPower, getTimeAgo } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Crown,
  Edit,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
  lastActive: Date;
}

interface MembersTableProps {
  members: Member[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function MembersTable({
  members,
  currentPage,
  totalPages,
  totalCount,
}: MembersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy") || "power";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  const updateSort = (field: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (currentSortBy === field) {
      // Toggle order
      newParams.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field
      newParams.set("sortBy", field);
      newParams.set("sortOrder", "desc");
    }

    router.push(`/members?${newParams.toString()}`);
  };

  const changePage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    router.push(`/members?${newParams.toString()}`);
  };

  const getSortIcon = (field: string) => {
    if (currentSortBy !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return currentSortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "R5":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "R4":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "R5":
        return "Leader";
      case "R4":
        return "Officier";
      default:
        return "Membre";
    }
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSort("pseudo")}
                  className="h-auto p-0 font-semibold"
                >
                  Pseudo
                  {getSortIcon("pseudo")}
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSort("level")}
                  className="h-auto p-0 font-semibold"
                >
                  Niveau
                  {getSortIcon("level")}
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSort("power")}
                  className="h-auto p-0 font-semibold"
                >
                  Puissance
                  {getSortIcon("power")}
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSort("kills")}
                  className="h-auto p-0 font-semibold"
                >
                  Kills
                  {getSortIcon("kills")}
                </Button>
              </th>
              <th className="text-left p-4">Spécialité</th>
              <th className="text-left p-4">Rôle</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateSort("lastActive")}
                  className="h-auto p-0 font-semibold"
                >
                  Dernière activité
                  {getSortIcon("lastActive")}
                </Button>
              </th>
              <th className="text-center p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border hover:bg-muted/50"
              >
                <td className="p-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {member.pseudo}
                    </p>
                    {member.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {member.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {member.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{member.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-medium">{member.level}</span>
                </td>
                <td className="p-4">
                  <span className="power-display">
                    {formatPower(member.power)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-medium text-lastwar-red">
                    {member.kills.toLocaleString()}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      member.specialty === "Sniper"
                        ? "bg-red-500/20 text-red-400"
                        : member.specialty === "Tank"
                        ? "bg-blue-500/20 text-blue-400"
                        : member.specialty === "Farmer"
                        ? "bg-green-500/20 text-green-400"
                        : member.specialty === "Defense"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {member.specialty || "Non définie"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.allianceRole)}
                    <span className="text-sm">
                      {getRoleLabel(member.allianceRole)}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs border ${
                      member.status === "ACTIVE"
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {member.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {getTimeAgo(member.lastActive)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {(currentPage - 1) * 20 + 1} à{" "}
            {Math.min(currentPage * 20, totalCount)} sur {totalCount} membres
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => changePage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun membre trouvé
          </h3>
          <p className="text-muted-foreground">
            Aucun membre ne correspond à vos critères de recherche.
          </p>
        </div>
      )}
    </div>
  );
}
