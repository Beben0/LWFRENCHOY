"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Filter, Plus, Search, Upload, Users, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface FilterOptions {
  specialties: string[];
  roles: string[];
}

interface MembersHeaderProps {
  totalMembers: number;
  filterOptions: FilterOptions;
}

export function MembersHeader({
  totalMembers,
  filterOptions,
}: MembersHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const currentSearch = searchParams.get("search") || "";
  const currentSpecialty = searchParams.get("specialty") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentRole = searchParams.get("role") || "";

  const updateUrl = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    // Reset to page 1 when filtering
    newParams.delete("page");

    router.push(`/members?${newParams.toString()}`);
  };

  const clearFilters = () => {
    router.push("/members");
  };

  const hasActiveFilters =
    currentSearch || currentSpecialty || currentStatus || currentRole;

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestion des Membres
          </h1>
          <p className="text-muted-foreground">
            {totalMembers} membres dans votre alliance
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importer CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" className="lastwar-gradient text-black">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Membre
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent"
                  value={currentSearch}
                  onChange={(e) =>
                    updateUrl({ search: e.target.value || null })
                  }
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-lastwar-red rounded-full" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Specialty Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Spécialité
                  </label>
                  <select
                    value={currentSpecialty}
                    onChange={(e) =>
                      updateUrl({ specialty: e.target.value || null })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Toutes les spécialités</option>
                    {filterOptions.specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Statut
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) =>
                      updateUrl({ status: e.target.value || null })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rôle Alliance
                  </label>
                  <select
                    value={currentRole}
                    onChange={(e) =>
                      updateUrl({ role: e.target.value || null })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Tous les rôles</option>
                    {filterOptions.roles.map((role) => (
                      <option key={role} value={role}>
                        {role === "R5"
                          ? "Leader (R5)"
                          : role === "R4"
                          ? "Officier (R4)"
                          : "Membre"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
