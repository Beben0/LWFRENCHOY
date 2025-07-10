"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { Translate } from "../ui/translate";
import qgData from "./__qgData.json";

// Types
export interface BuildingStep {
  building: string;
  level: number;
  food: number;
  iron: number;
  gold: number;
  oil?: number;
  time: number; // in minutes
  isChecked?: boolean;
  requirement?: boolean;
  additional?: boolean;
  groupLevel?: number;
  isQG?: boolean;
  requirementFor?: number | null;
}

export type Progression = Record<string, number>;

interface HeadquartersCalculatorProps {
  progression?: Progression;
  buildingData?: BuildingStep[];
}

// Helper: get all building names
const allBuildings = (buildingData: BuildingStep[]) =>
  Array.from(new Set(buildingData.map((b) => b.building)));

function getUpgradePath({
  currentLevel,
  targetLevel,
  progression,
  buildingData,
}: {
  currentLevel: number;
  targetLevel: number;
  progression: Progression;
  buildingData: BuildingStep[];
}): BuildingStep[] {
  const steps: BuildingStep[] = [];
  const prog: Progression = { ...progression };
  const alreadyAdded = new Set<string>();

  for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
    // 1. Trouver le QG pour ce niveau
    const qg = buildingData.find((b) => b.building === "HQ" && b.level === lvl);
    if (!qg) continue;

    // 2. Trouver tous les prérequis pour ce niveau de QG (palier précédent)
    const prereqs = buildingData.filter(
      (b) =>
        b.requirement === true &&
        b.groupLevel === lvl - 1 &&
        b.level === lvl - 1 &&
        b.building !== "HQ"
    );

    // 3. Ajouter tous les prérequis nécessaires (pas déjà atteints)
    for (const req of prereqs) {
      const currentBuildingLevel = prog[req.building] || 0;
      if (currentBuildingLevel < req.level) {
        const reqKey = `${req.building}-${req.level}`;
        if (!alreadyAdded.has(reqKey)) {
          steps.push({ ...req, isQG: false, requirementFor: lvl });
          alreadyAdded.add(reqKey);
          prog[req.building] = req.level;
        }
      }
    }

    // 4. Ensuite ajouter le QG lui-même
    const qgKey = `HQ-${lvl}`;
    if (!alreadyAdded.has(qgKey)) {
      steps.push({ ...qg, isQG: true, requirementFor: null });
      alreadyAdded.add(qgKey);
      prog["HQ"] = lvl;
    }
  }

  return steps;
}

export default function HeadquartersCalculator() {
  const buildingData: BuildingStep[] = qgData.buildingData;
  const [currentLevel, setCurrentLevel] = useState<number>(16); // Valeur par défaut
  const [targetLevel, setTargetLevel] = useState<number>(currentLevel + 1);
  const [speedBonus, setSpeedBonus] = useState<number>(0);
  const [resourceReduction, setResourceReduction] = useState<number>(0);
  // Nouvel état pour les cases cochées
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Créer une progression basée sur le niveau QG actuel
  const progression = useMemo(() => {
    // Progression vierge : seul le QG est au niveau actuel, tout le reste est à 0
    return { HQ: currentLevel };
  }, [currentLevel]);

  // Compute steps and totals
  const steps = useMemo(() => {
    const result = getUpgradePath({
      currentLevel,
      targetLevel,
      progression,
      buildingData,
    });
    // On convertit tous les temps en minutes
    return result.map((s) => ({ ...s, time: Math.round(s.time / 60) }));
  }, [currentLevel, targetLevel, progression, buildingData]);

  // Filtrer les steps non cochés pour le total
  const filteredSteps = steps.filter((_, i) => !checkedSteps.has(i));

  const total = filteredSteps.reduce(
    (acc, s) => {
      acc.food += s.food;
      acc.iron += s.iron;
      acc.gold += s.gold;
      acc.oil += s.oil || 0;
      acc.time += s.time;
      return acc;
    },
    { food: 0, iron: 0, gold: 0, oil: 0, time: 0 }
  );

  // Apply bonuses
  const factor = 1 - resourceReduction / 100;
  const speed = 1 + speedBonus / 100;
  const totalReduced = {
    food: Math.round(total.food * factor),
    iron: Math.round(total.iron * factor),
    gold: Math.round(total.gold * factor),
    oil: Math.round(total.oil * factor),
    time: Math.round(total.time / speed),
  };

  // Helper: format time (min) to d/h/m
  function formatTime(mins: number) {
    if (!mins) return "-";
    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    const m = mins % 60;
    return (
      [d ? `${d}j` : null, h ? `${h}h` : null, m ? `${m}m` : null]
        .filter(Boolean)
        .join(" ") || "Instantané"
    );
  }

  // UI
  return (
    <div className="space-y-6">
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-orange-50 dark:bg-orange-900/30">
          <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
            <Translate>🏢 Calculateur de Quartier Général</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Translate>% Bonus Vitesse Construction</Translate>
              </label>
              <input
                type="number"
                min="0"
                max="900"
                value={speedBonus}
                onChange={(e) =>
                  setSpeedBonus(
                    Math.max(0, Math.min(900, parseInt(e.target.value) || 0))
                  )
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Translate>% Réduction Coût Ressources</Translate>
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={resourceReduction}
                onChange={(e) =>
                  setResourceReduction(
                    Math.max(0, Math.min(90, parseInt(e.target.value) || 0))
                  )
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Translate>Niveau QG Actuel</Translate>
              </label>
              <input
                type="number"
                min="1"
                max="34"
                value={currentLevel}
                onChange={(e) => {
                  let v = parseInt(e.target.value) || 1;
                  if (v < 1) v = 1;
                  if (v > 34) v = 34;
                  setCurrentLevel(v);
                  setTargetLevel((t) => (t <= v ? v + 1 : t));
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Translate>Niveau QG Cible</Translate>
              </label>
              <input
                type="number"
                min={currentLevel + 1}
                max="35"
                value={targetLevel}
                onChange={(e) => {
                  let v = parseInt(e.target.value) || 2;
                  if (v <= currentLevel) v = currentLevel + 1;
                  if (v > 35) v = 35;
                  setTargetLevel(v);
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
              <Translate>Ressources Totales Requises</Translate>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <Translate>⚙️ Fer</Translate>
                </p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {totalReduced.iron.toLocaleString()}{" "}
                  <span className="text-xs text-green-600 dark:text-green-400">
                    <Translate>(réduit)</Translate>
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <Translate>🍖 Nourriture</Translate>
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {totalReduced.food.toLocaleString()}{" "}
                  <span className="text-xs text-green-600 dark:text-green-400">
                    <Translate>(réduit)</Translate>
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <Translate>🪙 Or</Translate>
                </p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {totalReduced.gold.toLocaleString()}{" "}
                  <span className="text-xs text-green-600 dark:text-green-400">
                    <Translate>(réduit)</Translate>
                  </span>
                </p>
              </div>
              {totalReduced.oil > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <Translate>🛢️ Pétrole</Translate>
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {totalReduced.oil.toLocaleString()}{" "}
                    <span className="text-xs text-green-600 dark:text-green-400">
                      <Translate>(réduit)</Translate>
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Translate>Temps total :</Translate>{" "}
              <b className="text-foreground">{formatTime(total.time)}</b> (
              <span className="text-green-600 dark:text-green-400">
                {formatTime(totalReduced.time)} <Translate>réduit</Translate>
              </span>
              )
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-orange-700 dark:text-orange-200 mb-2">
              <Translate>Étapes détaillées</Translate>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm border dark:border-gray-600">
                <thead>
                  <tr className="bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100">
                    <th className="p-2">
                      <Translate>Fait</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Type</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Niveau</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Fer</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Fer (réduit)</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Nourriture</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Nourriture (réduit)</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Or</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Or (réduit)</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Pétrole</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Pétrole (réduit)</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Temps</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Temps réduit</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>(min)</Translate>
                    </th>
                    <th className="p-2">
                      <Translate>Prérequis pour</Translate>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s, i) => {
                    const factor = 1 - resourceReduction / 100;
                    const speed = 1 + speedBonus / 100;
                    const ironReduced = Math.round(s.iron * factor);
                    const foodReduced = Math.round(s.food * factor);
                    const goldReduced = Math.round(s.gold * factor);
                    const oilReduced = Math.round((s.oil || 0) * factor);
                    const timeReduced = Math.round(s.time / speed);
                    return (
                      <tr
                        key={i}
                        className={
                          s.isQG ? "bg-orange-50 dark:bg-orange-900/30" : ""
                        }
                      >
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={checkedSteps.has(i)}
                            onChange={() => {
                              setCheckedSteps((prev) => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i);
                                else next.add(i);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="p-2 font-bold text-foreground">
                          {s.isQG ? (
                            <Translate>QG</Translate>
                          ) : (
                            <Translate>{s.building}</Translate>
                          )}
                        </td>
                        <td className="p-2">{s.level}</td>
                        <td className="p-2">{s.iron.toLocaleString()}</td>
                        <td className="p-2 text-green-600 dark:text-green-400">
                          {ironReduced.toLocaleString()}
                        </td>
                        <td className="p-2">{s.food.toLocaleString()}</td>
                        <td className="p-2 text-green-600 dark:text-green-400">
                          {foodReduced.toLocaleString()}
                        </td>
                        <td className="p-2">{s.gold.toLocaleString()}</td>
                        <td className="p-2 text-green-600 dark:text-green-400">
                          {goldReduced.toLocaleString()}
                        </td>
                        <td className="p-2">
                          {s.oil ? (
                            s.oil.toLocaleString()
                          ) : (
                            <Translate>-</Translate>
                          )}
                        </td>
                        <td className="p-2 text-green-600 dark:text-green-400">
                          {s.oil ? (
                            oilReduced.toLocaleString()
                          ) : (
                            <Translate>-</Translate>
                          )}
                        </td>
                        <td className="p-2">{formatTime(s.time)}</td>
                        <td className="p-2 text-green-600 dark:text-green-400">
                          {formatTime(timeReduced)}
                        </td>
                        <td className="p-2">{s.time}</td>
                        <td className="p-2">
                          {typeof s.requirementFor === "number" ? (
                            <>
                              <Translate>QG</Translate> {s.requirementFor}
                            </>
                          ) : (
                            <Translate>-</Translate>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
