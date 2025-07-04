"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Warehouse } from "lucide-react";
import { useState } from "react";

interface ResourceCalculation {
  type: "steel" | "food" | "fuel";
  icon: string;
  color: string;
  current: number;
  target: number;
  production: number;
  storage: number;
  timeToTarget: string;
}

const RESOURCE_ICONS = {
  steel: "🔩",
  food: "🍖",
  fuel: "⛽",
};

const RESOURCE_COLORS = {
  steel: "#6B7280",
  food: "#F97316",
  fuel: "#EAB308",
};

export function ResourceCalculator() {
  const [steelCurrent, setSteelCurrent] = useState(0);
  const [steelTarget, setSteelTarget] = useState(100000);
  const [steelProduction, setSteelProduction] = useState(1000);
  const [steelStorage, setSteelStorage] = useState(500000);

  const [foodCurrent, setFoodCurrent] = useState(0);
  const [foodTarget, setFoodTarget] = useState(100000);
  const [foodProduction, setFoodProduction] = useState(1200);
  const [foodStorage, setFoodStorage] = useState(500000);

  const [fuelCurrent, setFuelCurrent] = useState(0);
  const [fuelTarget, setFuelTarget] = useState(50000);
  const [fuelProduction, setFuelProduction] = useState(800);
  const [fuelStorage, setFuelStorage] = useState(300000);

  const calculateTimeToTarget = (
    current: number,
    target: number,
    production: number
  ): string => {
    if (current >= target) return "Déjà atteint";
    if (production <= 0) return "Production insuffisante";

    const needed = target - current;
    const hoursNeeded = needed / production;

    if (hoursNeeded < 1) {
      return `${Math.ceil(hoursNeeded * 60)}m`;
    } else if (hoursNeeded < 24) {
      return `${Math.ceil(hoursNeeded)}h`;
    } else {
      const days = Math.floor(hoursNeeded / 24);
      const hours = Math.ceil(hoursNeeded % 24);
      return `${days}j ${hours}h`;
    }
  };

  const resources: ResourceCalculation[] = [
    {
      type: "steel",
      icon: RESOURCE_ICONS.steel,
      color: RESOURCE_COLORS.steel,
      current: steelCurrent,
      target: steelTarget,
      production: steelProduction,
      storage: steelStorage,
      timeToTarget: calculateTimeToTarget(
        steelCurrent,
        steelTarget,
        steelProduction
      ),
    },
    {
      type: "food",
      icon: RESOURCE_ICONS.food,
      color: RESOURCE_COLORS.food,
      current: foodCurrent,
      target: foodTarget,
      production: foodProduction,
      storage: foodStorage,
      timeToTarget: calculateTimeToTarget(
        foodCurrent,
        foodTarget,
        foodProduction
      ),
    },
    {
      type: "fuel",
      icon: RESOURCE_ICONS.fuel,
      color: RESOURCE_COLORS.fuel,
      current: fuelCurrent,
      target: fuelTarget,
      production: fuelProduction,
      storage: fuelStorage,
      timeToTarget: calculateTimeToTarget(
        fuelCurrent,
        fuelTarget,
        fuelProduction
      ),
    },
  ];

  const resetCalculator = () => {
    setSteelCurrent(0);
    setSteelTarget(100000);
    setSteelProduction(1000);
    setFoodCurrent(0);
    setFoodTarget(100000);
    setFoodProduction(1200);
    setFuelCurrent(0);
    setFuelTarget(50000);
    setFuelProduction(800);
  };

  const totalProduction = steelProduction + foodProduction + fuelProduction;
  const averageEfficiency =
    resources.reduce((sum, resource) => {
      const efficiency = (resource.current / resource.storage) * 100;
      return sum + efficiency;
    }, 0) / 3;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Calculateur de Ressources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-semibold">Production Totale</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalProduction.toLocaleString()}/h
                </p>
                <p className="text-sm text-muted-foreground">
                  toutes ressources
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-5 h-5" />
                  <h3 className="font-semibold">Efficacité Stockage</h3>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {averageEfficiency.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  utilisation moyenne
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <h3 className="font-semibold">Optimisation</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((totalProduction / 3000) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">de l'optimal</p>
              </CardContent>
            </Card>
          </div>

          {/* Resource Configuration */}
          <div className="space-y-6">
            {resources.map((resource) => (
              <Card key={resource.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">{resource.icon}</span>
                    {resource.type.charAt(0).toUpperCase() +
                      resource.type.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Actuel</label>
                      <input
                        type="number"
                        value={
                          resource.type === "steel"
                            ? steelCurrent
                            : resource.type === "food"
                            ? foodCurrent
                            : fuelCurrent
                        }
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (resource.type === "steel") setSteelCurrent(value);
                          else if (resource.type === "food")
                            setFoodCurrent(value);
                          else setFuelCurrent(value);
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Objectif</label>
                      <input
                        type="number"
                        value={
                          resource.type === "steel"
                            ? steelTarget
                            : resource.type === "food"
                            ? foodTarget
                            : fuelTarget
                        }
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (resource.type === "steel") setSteelTarget(value);
                          else if (resource.type === "food")
                            setFoodTarget(value);
                          else setFuelTarget(value);
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="100000"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Production/h
                      </label>
                      <input
                        type="number"
                        value={
                          resource.type === "steel"
                            ? steelProduction
                            : resource.type === "food"
                            ? foodProduction
                            : fuelProduction
                        }
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (resource.type === "steel")
                            setSteelProduction(value);
                          else if (resource.type === "food")
                            setFoodProduction(value);
                          else setFuelProduction(value);
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="1000"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Stockage Max
                      </label>
                      <input
                        type="number"
                        value={resource.storage}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (resource.type === "steel") setSteelStorage(value);
                          else if (resource.type === "food")
                            setFoodStorage(value);
                          else setFuelStorage(value);
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="500000"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Progress and Time */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progression vers l'objectif</span>
                      <span>
                        {((resource.current / resource.target) * 100).toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: resource.color,
                          width: `${Math.min(
                            100,
                            (resource.current / resource.target) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {resource.current.toLocaleString()} /{" "}
                        {resource.target.toLocaleString()}
                      </span>
                      <span className="font-medium">
                        {resource.timeToTarget}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={resetCalculator}>
              Réinitialiser
            </Button>
            <div className="text-sm text-muted-foreground">
              Production: {totalProduction.toLocaleString()}/h
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils d'Optimisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resources.map((resource) => {
              const efficiency = (resource.current / resource.storage) * 100;
              const needed = Math.max(0, resource.target - resource.current);

              return (
                <div
                  key={resource.type}
                  className="p-3 bg-accent/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{resource.icon}</span>
                    <h4 className="font-medium capitalize">{resource.type}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {efficiency > 90
                      ? "⚠️ Stockage presque plein - augmentez la capacité"
                      : efficiency < 20
                      ? "📈 Stockage faible - production optimale"
                      : needed > 0
                      ? `⏱️ Temps estimé: ${resource.timeToTarget} pour atteindre l'objectif`
                      : "✅ Objectif atteint"}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
