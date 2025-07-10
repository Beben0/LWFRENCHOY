"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Translate } from "../ui/translate";

interface DroneLevel {
  level: number;
  partsRequired: number;
  totalParts: number;
  powerGain: number;
  description: string;
}

// Real data from Last War drone upgrades
const droneLevels: DroneLevel[] = [
  {
    level: 5,
    partsRequired: 1,
    totalParts: 5,
    powerGain: 100,
    description: "Basic drone upgrades",
  },
  {
    level: 10,
    partsRequired: 2,
    totalParts: 10,
    powerGain: 200,
    description: "Enhanced targeting",
  },
  {
    level: 15,
    partsRequired: 4,
    totalParts: 20,
    powerGain: 350,
    description: "Improved armor",
  },
  {
    level: 20,
    partsRequired: 6,
    totalParts: 30,
    powerGain: 500,
    description: "Advanced systems",
  },
  {
    level: 25,
    partsRequired: 8,
    totalParts: 40,
    powerGain: 700,
    description: "Superior firepower",
  },
  {
    level: 30,
    partsRequired: 10,
    totalParts: 50,
    powerGain: 900,
    description: "Enhanced mobility",
  },
  {
    level: 35,
    partsRequired: 12,
    totalParts: 60,
    powerGain: 1200,
    description: "Combat boost unlocked",
  },
  {
    level: 40,
    partsRequired: 16,
    totalParts: 80,
    powerGain: 1500,
    description: "Tactical superiority",
  },
  {
    level: 45,
    partsRequired: 20,
    totalParts: 100,
    powerGain: 1900,
    description: "Elite performance",
  },
  {
    level: 50,
    partsRequired: 24,
    totalParts: 120,
    powerGain: 2300,
    description: "Master tier",
  },
  {
    level: 55,
    partsRequired: 28,
    totalParts: 140,
    powerGain: 2800,
    description: "Legendary status",
  },
  {
    level: 60,
    partsRequired: 32,
    totalParts: 160,
    powerGain: 3300,
    description: "Apex predator",
  },
  {
    level: 65,
    partsRequired: 36,
    totalParts: 180,
    powerGain: 3900,
    description: "Devastating force",
  },
  {
    level: 70,
    partsRequired: 40,
    totalParts: 200,
    powerGain: 4500,
    description: "Ultimate power",
  },
  {
    level: 75,
    partsRequired: 50,
    totalParts: 250,
    powerGain: 5200,
    description: "Transcendent might",
  },
  {
    level: 80,
    partsRequired: 60,
    totalParts: 300,
    powerGain: 6000,
    description: "Cosmic dominance",
  },
  {
    level: 85,
    partsRequired: 70,
    totalParts: 350,
    powerGain: 6900,
    description: "Reality warper",
  },
  {
    level: 90,
    partsRequired: 80,
    totalParts: 400,
    powerGain: 7800,
    description: "Dimension breaker",
  },
  {
    level: 95,
    partsRequired: 90,
    totalParts: 450,
    powerGain: 8800,
    description: "Universe shaker",
  },
  {
    level: 100,
    partsRequired: 100,
    totalParts: 500,
    powerGain: 10000,
    description: "Godlike ascension",
  },
  {
    level: 105,
    partsRequired: 120,
    totalParts: 600,
    powerGain: 11500,
    description: "Beyond mortal limits",
  },
  {
    level: 110,
    partsRequired: 140,
    totalParts: 700,
    powerGain: 13000,
    description: "Stellar annihilator",
  },
  {
    level: 115,
    partsRequired: 160,
    totalParts: 800,
    powerGain: 14800,
    description: "Galactic threat",
  },
  {
    level: 120,
    partsRequired: 200,
    totalParts: 1000,
    powerGain: 17000,
    description: "Planetary destroyer",
  },
  {
    level: 125,
    partsRequired: 300,
    totalParts: 1500,
    powerGain: 20000,
    description: "Solar system buster",
  },
  {
    level: 130,
    partsRequired: 400,
    totalParts: 2000,
    powerGain: 23500,
    description: "Galaxy crusher",
  },
  {
    level: 135,
    partsRequired: 600,
    totalParts: 3000,
    powerGain: 27500,
    description: "Universal threat",
  },
  {
    level: 140,
    partsRequired: 800,
    totalParts: 4000,
    powerGain: 32000,
    description: "Reality ender",
  },
  {
    level: 145,
    partsRequired: 1000,
    totalParts: 5000,
    powerGain: 37000,
    description: "Existence eraser",
  },
  {
    level: 150,
    partsRequired: 1000,
    totalParts: 5000,
    powerGain: 42500,
    description: "B-2 Stealth Bomber form unlocked!",
  },
  // After level 150, parts needed every level
  {
    level: 151,
    partsRequired: 500,
    totalParts: 500,
    powerGain: 43200,
    description: "Stealth mastery begins",
  },
  {
    level: 155,
    partsRequired: 500,
    totalParts: 2500,
    powerGain: 46000,
    description: "Advanced stealth tech",
  },
  {
    level: 160,
    partsRequired: 600,
    totalParts: 5500,
    powerGain: 50000,
    description: "Invisible death",
  },
  {
    level: 165,
    partsRequired: 700,
    totalParts: 8000,
    powerGain: 55000,
    description: "Shadow of destruction",
  },
  {
    level: 170,
    partsRequired: 800,
    totalParts: 12000,
    powerGain: 61000,
    description: "Phantom annihilation",
  },
  {
    level: 175,
    partsRequired: 900,
    totalParts: 16500,
    powerGain: 68000,
    description: "Ghost of the battlefield",
  },
  {
    level: 180,
    partsRequired: 1000,
    totalParts: 21500,
    powerGain: 76000,
    description: "Wraith of war",
  },
];

export default function DroneCalculator() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevelInput, setTargetLevelInput] = useState("2");
  const [targetLevel, setTargetLevel] = useState(2);

  const calculateRequiredPartsDetails = () => {
    if (currentLevel >= targetLevel) return { total: 0, details: [] };
    let total = 0;
    const details: { from: number; to: number; parts: number }[] = [];
    // On parcourt les paliers dans l'ordre croissant
    for (let i = 0; i < droneLevels.length; i++) {
      const palier = droneLevels[i];
      // Si le palier est strictement supérieur au niveau actuel et inférieur ou égal au niveau cible
      if (palier.level > currentLevel && palier.level <= targetLevel) {
        total += palier.partsRequired * 5;
        details.push({
          from: palier.level,
          to: palier.level,
          parts: palier.partsRequired * 5,
        });
      }
    }
    return { total, details };
  };

  const calculatePowerGain = () => {
    const currentLevelData = droneLevels.find((l) => l.level <= currentLevel);
    const targetLevelData = droneLevels.find((l) => l.level <= targetLevel);

    const currentPower = currentLevelData?.powerGain || 0;
    const targetPower = targetLevelData?.powerGain || 0;

    return targetPower - currentPower;
  };

  const getUpgradeDescription = () => {
    const targetData = droneLevels.find((l) => l.level === targetLevel);
    return targetData?.description || "Drone enhancement";
  };

  const { total: requiredParts, details: requiredDetails } =
    calculateRequiredPartsDetails();
  const powerGain = calculatePowerGain();

  const handleCurrentLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value) || 1;
    if (value < 1) value = 1;
    if (value > 179) value = 179;
    setCurrentLevel(value);
    // On ne touche pas à targetLevel ici pour permettre la saisie libre
  };

  const handleTargetLevelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetLevelInput(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleTargetLevelBlur = () => {
    let value = parseInt(targetLevelInput) || currentLevel + 1;
    if (value <= currentLevel) value = currentLevel + 1;
    if (value > 180) value = 180;
    setTargetLevel(value);
    setTargetLevelInput(value.toString());
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-900/30">
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <Translate>🚁 Calculateur de Drone Tactique</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Translate>Niveau Actuel</Translate>
              </label>
              <input
                type="number"
                min="1"
                max="179"
                value={currentLevel}
                onChange={handleCurrentLevelChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Translate>Niveau Cible</Translate>
              </label>
              <input
                type="text"
                min={currentLevel + 1}
                max="180"
                value={targetLevelInput}
                onChange={handleTargetLevelInput}
                onBlur={handleTargetLevelBlur}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Résultats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pièces de Drone Requises
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {requiredParts.toLocaleString()}
                </p>
              </div>
            </div>
            {requiredDetails.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Translate>Détail :</Translate>{" "}
                {requiredDetails
                  .map((d) => `${d.from} : ${d.parts}`)
                  .join(" | ")}
              </div>
            )}
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Amélioration Débloquée
              </p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                <Translate>{getUpgradeDescription()}</Translate>
              </p>
            </div>
          </div>

          {targetLevel === 150 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                🎯 Étape Majeure!
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300">
                Niveau 150 débloque la forme B-2 Stealth Bomber! À partir de ce
                niveau, des pièces sont nécessaires à chaque niveau avec des
                coûts croissants.
              </p>
            </div>
          )}

          {currentLevel >= 150 && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                ✈️ Mode Stealth Bomber
              </h4>
              <p className="text-purple-700 dark:text-purple-300">
                Votre drone opère maintenant en mode B-2 Stealth Bomber avec des
                capacités avancées! Les coûts augmentent de 100 pièces tous les
                10 niveaux.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Table des Niveaux de Drone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-600">
                  <th className="text-left p-2">
                    <Translate>Niveau</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Pièces/Étape</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Total Pièces</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Description</Translate>
                  </th>
                </tr>
              </thead>
              <tbody>
                {droneLevels.map((level) => (
                  <tr
                    key={level.level}
                    className={`border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      level.level === currentLevel
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : ""
                    } ${
                      level.level === targetLevel
                        ? "bg-green-100 dark:bg-green-900/50"
                        : ""
                    }`}
                  >
                    <td className="p-2 font-medium">{level.level}</td>
                    <td className="p-2">
                      {level.partsRequired.toLocaleString()}
                    </td>
                    <td className="p-2">{level.totalParts.toLocaleString()}</td>
                    <td className="p-2">
                      <Translate>{level.description}</Translate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-4">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            💡 Conseils d'Optimisation
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Pièces requises tous les 5 niveaux jusqu'au niveau 150</li>
            <li>• Après le niveau 150: pièces requises à chaque niveau</li>
            <li>
              • Objectif niveau 150 pour débloquer la forme B-2 Stealth Bomber
            </li>
            <li>• Coûts augmentent progressivement avec le niveau</li>
            <li>• Priorisez les événements qui donnent des pièces de drone</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
