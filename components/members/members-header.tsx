"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
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
      {/* Title & Actions amélioré */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                Gestion des Membres
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                {totalMembers}{" "}
                <Translate>membres dans votre alliance</Translate> •{" "}
                <Translate>Gestion complète</Translate>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Importer CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exporter</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                size="sm"
                className="lastwar-gradient text-black hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nouveau Membre</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters amélioré */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
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
              className={`bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white ${
                showFilters ? "bg-blue-600 text-white border-blue-500" : ""
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                <Translate>Filtres</Translate>
              </span>
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  <Translate>Effacer</Translate>
                </span>
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Specialty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Translate>Spécialité</Translate>
                  </label>
                  <select
                    value={currentSpecialty}
                    onChange={(e) =>
                      updateUrl({ specialty: e.target.value || null })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">
                      <Translate>Toutes les spécialités</Translate>
                    </option>
                    {filterOptions.specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        <Translate>{specialty}</Translate>
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Translate>Statut</Translate>
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) =>
                      updateUrl({ status: e.target.value || null })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">
                      <Translate>Tous les statuts</Translate>
                    </option>
                    <option value="ACTIVE">
                      <Translate>Actif</Translate>
                    </option>
                    <option value="INACTIVE">
                      <Translate>Inactif</Translate>
                    </option>
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Translate>Rôle Alliance</Translate>
                  </label>
                  <select
                    value={currentRole}
                    onChange={(e) =>
                      updateUrl({ role: e.target.value || null })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">
                      <Translate>Tous les rôles</Translate>
                    </option>
                    {filterOptions.roles.map((role) => (
                      <option key={role} value={role}>
                        {role === "R5" ? (
                          <Translate>Leader (R5)</Translate>
                        ) : role === "R4" ? (
                          <Translate>Officier (R4)</Translate>
                        ) : (
                          <Translate>Membre</Translate>
                        )}
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
