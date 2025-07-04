"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap } from "lucide-react";
import { useState } from "react";

interface DroneLevel {
  level: number;
  piecesRequired: number;
  cumulativePieces: number;
  power: number;
}

const DRONE_DATA: DroneLevel[] = [
  { level: 1, piecesRequired: 0, cumulativePieces: 0, power: 100 },
  { level: 2, piecesRequired: 10, cumulativePieces: 10, power: 250 },
  { level: 3, piecesRequired: 20, cumulativePieces: 30, power: 450 },
  { level: 4, piecesRequired: 35, cumulativePieces: 65, power: 700 },
  { level: 5, piecesRequired: 55, cumulativePieces: 120, power: 1000 },
  { level: 6, piecesRequired: 80, cumulativePieces: 200, power: 1350 },
  { level: 7, piecesRequired: 110, cumulativePieces: 310, power: 1750 },
  { level: 8, piecesRequired: 145, cumulativePieces: 455, power: 2200 },
  { level: 9, piecesRequired: 185, cumulativePieces: 640, power: 2700 },
  { level: 10, piecesRequired: 230, cumulativePieces: 870, power: 3250 },
  { level: 11, piecesRequired: 280, cumulativePieces: 1150, power: 3850 },
  { level: 12, piecesRequired: 335, cumulativePieces: 1485, power: 4500 },
  { level: 13, piecesRequired: 395, cumulativePieces: 1880, power: 5200 },
  { level: 14, piecesRequired: 460, cumulativePieces: 2340, power: 5950 },
  { level: 15, piecesRequired: 530, cumulativePieces: 2870, power: 6750 },
  { level: 16, piecesRequired: 605, cumulativePieces: 3475, power: 7600 },
  { level: 17, piecesRequired: 685, cumulativePieces: 4160, power: 8500 },
  { level: 18, piecesRequired: 770, cumulativePieces: 4930, power: 9450 },
  { level: 19, piecesRequired: 860, cumulativePieces: 5790, power: 10450 },
  { level: 20, piecesRequired: 955, cumulativePieces: 6745, power: 11500 },
];

export function DroneCalculator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(5);
  const [currentPieces, setCurrentPieces] = useState(0);

  const currentData = DRONE_DATA[currentLevel - 1];
  const targetData = DRONE_DATA[targetLevel - 1];

  const piecesNeeded = Math.max(
    0,
    targetData.cumulativePieces - currentData.cumulativePieces - currentPieces
  );
  const powerGain = targetData.power - currentData.power;

  const resetCalculator = () => {
    setCurrentLevel(1);
    setTargetLevel(5);
    setCurrentPieces(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚁 Calculateur de Drones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau Actuel</label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DRONE_DATA.slice(0, -1).map((drone) => (
                  <option key={drone.level} value={drone.level}>
                    Niveau {drone.level}
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
                {DRONE_DATA.slice(currentLevel).map((drone) => (
                  <option key={drone.level} value={drone.level}>
                    Niveau {drone.level}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pièces Actuelles</label>
              <input
                type="number"
                value={currentPieces}
                onChange={(e) => setCurrentPieces(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔧</span>
                  <h3 className="font-semibold">Pièces Nécessaires</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {piecesNeeded.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  pour passer au niveau {targetLevel}
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
                  +{powerGain.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentData.power.toLocaleString()} →{" "}
                  {targetData.power.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⏱️</span>
                  <h3 className="font-semibold">Progression</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {currentLevel} <ArrowRight className="w-4 h-4 inline mx-1" />{" "}
                  {targetLevel}
                </p>
                <p className="text-sm text-muted-foreground">
                  {targetLevel - currentLevel} niveaux
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
              Coût total: {targetData.cumulativePieces.toLocaleString()} pièces
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Table */}
      <Card>
        <CardHeader>
          <CardTitle>Table des Niveaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Niveau</th>
                  <th className="text-left p-2">Pièces Requises</th>
                  <th className="text-left p-2">Total Cumulé</th>
                  <th className="text-left p-2">Puissance</th>
                </tr>
              </thead>
              <tbody>
                {DRONE_DATA.slice(currentLevel - 1, targetLevel + 2).map(
                  (drone) => (
                    <tr
                      key={drone.level}
                      className={`border-b ${
                        drone.level === currentLevel
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : drone.level === targetLevel
                          ? "bg-green-50 dark:bg-green-950/30"
                          : ""
                      }`}
                    >
                      <td className="p-2 font-medium">{drone.level}</td>
                      <td className="p-2">
                        {drone.piecesRequired.toLocaleString()}
                      </td>
                      <td className="p-2">
                        {drone.cumulativePieces.toLocaleString()}
                      </td>
                      <td className="p-2">{drone.power.toLocaleString()}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
