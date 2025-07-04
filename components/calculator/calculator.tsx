"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import {
  Calculator as CalculatorIcon,
  Download,
  Save,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { DroneCalculator } from "./drone-calculator";
import { HeadquartersCalculator } from "./headquarters-calculator";
import { ResearchCalculator } from "./research-calculator";
import { ResourceCalculator } from "./resource-calculator";

type CalculatorTab = "drones" | "headquarters" | "research" | "resources";

interface CalculatorTabConfig {
  id: CalculatorTab;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const CALCULATOR_TABS: CalculatorTabConfig[] = [
  {
    id: "drones",
    label: "Drones",
    description: "Calculateur de pièces pour améliorer les drones",
    icon: "🚁",
    color: "#3B82F6",
  },
  {
    id: "headquarters",
    label: "QG",
    description: "Calculateur d'amélioration du quartier général",
    icon: "🏢",
    color: "#10B981",
  },
  {
    id: "research",
    label: "Recherche",
    description: "Calculateur de coûts de recherche",
    icon: "🔬",
    color: "#8B5CF6",
  },
  {
    id: "resources",
    label: "Ressources",
    description: "Calculateur de production et stockage",
    icon: "⚡",
    color: "#F59E0B",
  },
];

export function Calculator() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<CalculatorTab>("drones");
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);

  const canManagePresets = hasPermission(session, "manage_calculator_presets");
  const canExport = hasPermission(session, "export_calculator_results");

  const renderTabContent = () => {
    switch (activeTab) {
      case "drones":
        return <DroneCalculator />;
      case "headquarters":
        return <HeadquartersCalculator />;
      case "research":
        return <ResearchCalculator />;
      case "resources":
        return <ResourceCalculator />;
      default:
        return <DroneCalculator />;
    }
  };

  const handleSaveCalculation = () => {
    // Logique pour sauvegarder le calcul actuel
    console.log("Saving calculation...");
  };

  const handleExportResults = () => {
    // Logique pour exporter les résultats
    console.log("Exporting results...");
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <CalculatorIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Calculateur Last War</h1>
              <p className="text-muted-foreground">
                Outils de calcul pour optimiser votre progression
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManagePresets && (
            <Button variant="outline" onClick={handleSaveCalculation}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          )}
          {canExport && (
            <Button variant="outline" onClick={handleExportResults}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Types de Calculateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CALCULATOR_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  activeTab === tab.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tab.icon}</span>
                  <h3 className="font-semibold">{tab.label}</h3>
                  {activeTab === tab.id && (
                    <Badge
                      variant="default"
                      className="ml-auto"
                      style={{ backgroundColor: tab.color }}
                    >
                      Actif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tab.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculator Content */}
      <div className="min-h-[600px]">{renderTabContent()}</div>

      {/* Saved Calculations */}
      {canManagePresets && savedCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calculs Sauvegardés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedCalculations.map((calc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{calc.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {calc.type} - {calc.date}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Charger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
