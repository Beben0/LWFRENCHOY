"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building, Clock, Zap } from "lucide-react";
import { useState } from "react";

interface HQLevel {
  level: number;
  steel: number;
  food: number;
  fuel: number;
  time: string;
  power: number;
  unlocks: string[];
}

const HQ_DATA: HQLevel[] = [
  {
    level: 1,
    steel: 0,
    food: 0,
    fuel: 0,
    time: "0m",
    power: 200,
    unlocks: ["Base de départ"],
  },
  {
    level: 2,
    steel: 500,
    food: 500,
    fuel: 200,
    time: "5m",
    power: 500,
    unlocks: ["Centre de Recherche"],
  },
  {
    level: 3,
    steel: 1200,
    food: 1200,
    fuel: 500,
    time: "15m",
    power: 900,
    unlocks: ["Caserne", "Arsenal"],
  },
  {
    level: 4,
    steel: 2500,
    food: 2500,
    fuel: 1000,
    time: "45m",
    power: 1500,
    unlocks: ["Hôpital de Campagne"],
  },
  {
    level: 5,
    steel: 5000,
    food: 5000,
    fuel: 2000,
    time: "2h",
    power: 2500,
    unlocks: ["Tours de Guet", "Entrepôts"],
  },
  {
    level: 6,
    steel: 8500,
    food: 8500,
    fuel: 3500,
    time: "4h",
    power: 3800,
    unlocks: ["Centre de Communication"],
  },
  {
    level: 7,
    steel: 15000,
    food: 15000,
    fuel: 6000,
    time: "8h",
    power: 5500,
    unlocks: ["Laboratoire Avancé"],
  },
  {
    level: 8,
    steel: 25000,
    food: 25000,
    fuel: 10000,
    time: "16h",
    power: 7800,
    unlocks: ["Base de Drones"],
  },
  {
    level: 9,
    steel: 40000,
    food: 40000,
    fuel: 16000,
    time: "1j 8h",
    power: 10800,
    unlocks: ["Centre de Commandement"],
  },
  {
    level: 10,
    steel: 65000,
    food: 65000,
    fuel: 26000,
    time: "2j",
    power: 14500,
    unlocks: ["Forge Militaire"],
  },
];

export function HeadquartersCalculator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(5);
  const [currentSteel, setCurrentSteel] = useState(0);
  const [currentFood, setCurrentFood] = useState(0);
  const [currentFuel, setCurrentFuel] = useState(0);

  const calculateTotalResources = () => {
    let totalSteel = 0,
      totalFood = 0,
      totalFuel = 0;

    for (let i = currentLevel; i < targetLevel; i++) {
      totalSteel += HQ_DATA[i].steel;
      totalFood += HQ_DATA[i].food;
      totalFuel += HQ_DATA[i].fuel;
    }

    return {
      steel: Math.max(0, totalSteel - currentSteel),
      food: Math.max(0, totalFood - currentFood),
      fuel: Math.max(0, totalFuel - currentFuel),
    };
  };

  const needed = calculateTotalResources();
  const currentData = HQ_DATA[currentLevel - 1];
  const targetData = HQ_DATA[targetLevel - 1];
  const powerGain = targetData.power - currentData.power;

  const resetCalculator = () => {
    setCurrentLevel(1);
    setTargetLevel(5);
    setCurrentSteel(0);
    setCurrentFood(0);
    setCurrentFuel(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Calculateur de Quartier Général
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Niveau Actuel</label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {HQ_DATA.slice(0, -1).map((hq) => (
                    <option key={hq.level} value={hq.level}>
                      QG Niveau {hq.level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Niveau Cible</label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {HQ_DATA.slice(currentLevel).map((hq) => (
                    <option key={hq.level} value={hq.level}>
                      QG Niveau {hq.level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Acier Actuel</label>
                <input
                  type="number"
                  value={currentSteel}
                  onChange={(e) => setCurrentSteel(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nourriture Actuelle
                </label>
                <input
                  type="number"
                  value={currentFood}
                  onChange={(e) => setCurrentFood(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Carburant Actuel</label>
                <input
                  type="number"
                  value={currentFuel}
                  onChange={(e) => setCurrentFuel(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Resource Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-50 dark:bg-gray-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔩</span>
                  <h3 className="font-semibold">Acier Nécessaire</h3>
                </div>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {needed.steel.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍖</span>
                  <h3 className="font-semibold">Nourriture Nécessaire</h3>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {needed.food.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⛽</span>
                  <h3 className="font-semibold">Carburant Nécessaire</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {needed.fuel.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-semibold">Gain de Puissance</h3>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{powerGain.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentData.power.toLocaleString()} →{" "}
                  {targetData.power.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-semibold">Temps de Construction</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {targetData.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  pour le niveau {targetLevel}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Unlocks */}
          {targetData.unlocks.length > 0 && (
            <Card className="bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">
                  Débloqué au niveau {targetLevel}:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {targetData.unlocks.map((unlock, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-md text-sm"
                    >
                      {unlock}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={resetCalculator}>
              Réinitialiser
            </Button>
            <div className="text-sm text-muted-foreground">
              Progression: Niveau {currentLevel}{" "}
              <ArrowRight className="w-4 h-4 inline mx-1" /> {targetLevel}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
