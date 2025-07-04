"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Zap } from "lucide-react";
import { useState } from "react";

interface ResearchNode {
  id: string;
  name: string;
  category: string;
  level: number;
  intel: number;
  time: string;
  power: number;
  prerequisites: string[];
  effects: string[];
}

const RESEARCH_DATA: ResearchNode[] = [
  {
    id: "combat_1",
    name: "Formation de Combat I",
    category: "Combat",
    level: 1,
    intel: 1000,
    time: "30m",
    power: 200,
    prerequisites: [],
    effects: ["Dégâts d'infanterie +5%"],
  },
  {
    id: "combat_2",
    name: "Formation de Combat II",
    category: "Combat",
    level: 2,
    intel: 2500,
    time: "1h 30m",
    power: 500,
    prerequisites: ["combat_1"],
    effects: ["Dégâts d'infanterie +10%"],
  },
  {
    id: "defense_1",
    name: "Fortifications I",
    category: "Défense",
    level: 1,
    intel: 800,
    time: "25m",
    power: 150,
    prerequisites: [],
    effects: ["Défense de base +8%"],
  },
  {
    id: "economy_1",
    name: "Gestion des Ressources I",
    category: "Économie",
    level: 1,
    intel: 600,
    time: "20m",
    power: 100,
    prerequisites: [],
    effects: ["Production de ressources +5%"],
  },
  {
    id: "military_1",
    name: "Tactiques Militaires I",
    category: "Militaire",
    level: 1,
    intel: 1200,
    time: "45m",
    power: 300,
    prerequisites: [],
    effects: ["Capacité de troupes +10%"],
  },
  {
    id: "development_1",
    name: "Développement Urbain I",
    category: "Développement",
    level: 1,
    intel: 900,
    time: "35m",
    power: 180,
    prerequisites: [],
    effects: ["Vitesse de construction +8%"],
  },
];

export function ResearchCalculator() {
  const [selectedResearches, setSelectedResearches] = useState<string[]>([]);
  const [currentIntel, setCurrentIntel] = useState(0);

  const getSelectedNodes = () => {
    return RESEARCH_DATA.filter((node) => selectedResearches.includes(node.id));
  };

  const calculateTotals = () => {
    const selected = getSelectedNodes();
    return {
      intel: selected.reduce((sum, node) => sum + node.intel, 0),
      power: selected.reduce((sum, node) => sum + node.power, 0),
      count: selected.length,
    };
  };

  const totals = calculateTotals();
  const intelNeeded = Math.max(0, totals.intel - currentIntel);

  const toggleResearch = (researchId: string) => {
    setSelectedResearches((prev) => {
      if (prev.includes(researchId)) {
        return prev.filter((id) => id !== researchId);
      } else {
        return [...prev, researchId];
      }
    });
  };

  const resetCalculator = () => {
    setSelectedResearches([]);
    setCurrentIntel(0);
  };

  const groupedResearch = RESEARCH_DATA.reduce((groups, research) => {
    const category = research.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(research);
    return groups;
  }, {} as Record<string, ResearchNode[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Calculateur de Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intel Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intel Actuel</label>
              <input
                type="number"
                value={currentIntel}
                onChange={(e) => setCurrentIntel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Recherches Sélectionnées
              </label>
              <div className="p-3 bg-accent/30 rounded-md">
                <p className="font-semibold">{totals.count} recherches</p>
                <p className="text-sm text-muted-foreground">
                  {totals.intel.toLocaleString()} intel total
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="font-semibold">Intel Nécessaire</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {intelNeeded.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  pour toutes les recherches
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-semibold">Gain de Puissance</h3>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{totals.power.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  puissance totale
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-semibold">Recherches</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totals.count}
                </p>
                <p className="text-sm text-muted-foreground">
                  au total sélectionnées
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={resetCalculator}>
              Réinitialiser
            </Button>
            <div className="text-sm text-muted-foreground">
              Intel total: {totals.intel.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Selection */}
      <div className="space-y-6">
        {Object.entries(groupedResearch).map(([category, researches]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">Recherche {category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {researches.map((research) => (
                  <div
                    key={research.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedResearches.includes(research.id)
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                    onClick={() => toggleResearch(research.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{research.name}</h4>
                      <input
                        type="checkbox"
                        checked={selectedResearches.includes(research.id)}
                        onChange={() => toggleResearch(research.id)}
                        className="ml-2"
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Intel:</span>
                        <span className="font-medium">
                          {research.intel.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temps:</span>
                        <span className="font-medium">{research.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Puissance:
                        </span>
                        <span className="font-medium">
                          +{research.power.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {research.effects.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Effets:
                        </p>
                        {research.effects.map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-accent/50 text-xs rounded mr-1 mb-1"
                          >
                            {effect}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Research Summary */}
      {selectedResearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résumé des Recherches Sélectionnées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getSelectedNodes().map((research) => (
                <div
                  key={research.id}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{research.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {research.category} - {research.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {research.intel.toLocaleString()} intel
                    </p>
                    <p className="text-sm text-muted-foreground">
                      +{research.power.toLocaleString()} puissance
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
