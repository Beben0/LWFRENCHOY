"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator as CalculatorIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Translate } from "../ui/translate";
import DroneCalculator from "./drone-calculator";
import HeadquartersCalculator from "./headquarters-calculator";
import ResourceCalculator from "./resource-calculator";

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

  // Simplified permissions - assume user has access for now
  const canManagePresets = true;
  const canExport = true;

  const renderTabContent = () => {
    switch (activeTab) {
      case "drones":
        return <DroneCalculator />;
      case "headquarters":
        return <HeadquartersCalculator />;
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

  const saveResults = () => {
    // Logic to save calculator results
    alert("Résultats sauvegardés !");
  };

  const exportResults = () => {
    // Logic to export calculator results
    const data = {
      timestamp: new Date().toISOString(),
      activeTab,
      // Add actual calculation data here
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `last-war-calculator-${activeTab}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <CalculatorIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">
                <Translate>Calculateur Last War</Translate>
              </h1>
              <p className="text-muted-foreground">
                <Translate>
                  Suite d'outils pour optimiser ta progression sur Last War
                </Translate>
              </p>
            </div>
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
                    <h3 className="font-semibold">
                      <Translate>{tab.label}</Translate>
                    </h3>
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
                    <Translate>{tab.description}</Translate>
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
