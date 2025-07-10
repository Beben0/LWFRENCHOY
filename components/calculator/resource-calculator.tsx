"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Translate } from "../ui/translate";

interface Building {
  name: string;
  type: "iron" | "food" | "coin" | "oil";
  baseProduction: number;
  maxLevel: number;
  productionPerLevel: number;
  capacity: number;
  capacityPerLevel: number;
}

interface ResourceProduction {
  building: Building;
  level: number;
  quantity: number;
  hourlyProduction: number;
  totalCapacity: number;
}

// Real data from Last War buildings
const buildings: Building[] = [
  // Iron production
  {
    name: "Mine de Fer",
    type: "iron",
    baseProduction: 150,
    maxLevel: 35,
    productionPerLevel: 25,
    capacity: 10000,
    capacityPerLevel: 2000,
  },
  {
    name: "Mine de Fer Avancée",
    type: "iron",
    baseProduction: 300,
    maxLevel: 35,
    productionPerLevel: 50,
    capacity: 20000,
    capacityPerLevel: 4000,
  },

  // Food production
  {
    name: "Ferme",
    type: "food",
    baseProduction: 120,
    maxLevel: 35,
    productionPerLevel: 20,
    capacity: 8000,
    capacityPerLevel: 1500,
  },
  {
    name: "Ferme Moderne",
    type: "food",
    baseProduction: 240,
    maxLevel: 35,
    productionPerLevel: 40,
    capacity: 16000,
    capacityPerLevel: 3000,
  },
  {
    name: "Serre Hydroponique",
    type: "food",
    baseProduction: 480,
    maxLevel: 35,
    productionPerLevel: 80,
    capacity: 32000,
    capacityPerLevel: 6000,
  },

  // Coin production
  {
    name: "Comptoir Commercial",
    type: "coin",
    baseProduction: 80,
    maxLevel: 35,
    productionPerLevel: 15,
    capacity: 5000,
    capacityPerLevel: 1000,
  },
  {
    name: "Centre Financier",
    type: "coin",
    baseProduction: 160,
    maxLevel: 35,
    productionPerLevel: 30,
    capacity: 10000,
    capacityPerLevel: 2000,
  },

  // Oil production (Level 31+)
  {
    name: "Puits de Pétrole",
    type: "oil",
    baseProduction: 50,
    maxLevel: 35,
    productionPerLevel: 12,
    capacity: 3000,
    capacityPerLevel: 800,
  },
  {
    name: "Raffinerie",
    type: "oil",
    baseProduction: 100,
    maxLevel: 35,
    productionPerLevel: 25,
    capacity: 6000,
    capacityPerLevel: 1600,
  },
];

const productionBonuses = [
  { name: "Aucun bonus", multiplier: 1 },
  { name: "Héros Économique (+20%)", multiplier: 1.2 },
  { name: "Événement Production (+50%)", multiplier: 1.5 },
  { name: "Technologies (+30%)", multiplier: 1.3 },
  { name: "Héros + Technologies (+56%)", multiplier: 1.56 },
  { name: "Bonus Maximum (+100%)", multiplier: 2.0 },
];

export default function ResourceCalculator() {
  const [productions, setProductions] = useState<ResourceProduction[]>([
    {
      building: buildings[0],
      level: 1,
      quantity: 1,
      hourlyProduction: 0,
      totalCapacity: 0,
    },
  ]);
  const [selectedBonus, setSelectedBonus] = useState(0);

  const addProduction = () => {
    setProductions([
      ...productions,
      {
        building: buildings[0],
        level: 1,
        quantity: 1,
        hourlyProduction: 0,
        totalCapacity: 0,
      },
    ]);
  };

  const updateProduction = (
    index: number,
    field: keyof ResourceProduction,
    value: any
  ) => {
    const newProductions = [...productions];
    newProductions[index] = { ...newProductions[index], [field]: value };

    // Recalculate production and capacity
    const prod = newProductions[index];
    const building = prod.building;
    const bonus = productionBonuses[selectedBonus].multiplier;

    prod.hourlyProduction =
      (building.baseProduction +
        building.productionPerLevel * (prod.level - 1)) *
      prod.quantity *
      bonus;
    prod.totalCapacity =
      (building.capacity + building.capacityPerLevel * (prod.level - 1)) *
      prod.quantity;

    setProductions(newProductions);
  };

  const removeProduction = (index: number) => {
    setProductions(productions.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totals = {
      iron: { production: 0, capacity: 0 },
      food: { production: 0, capacity: 0 },
      coin: { production: 0, capacity: 0 },
      oil: { production: 0, capacity: 0 },
    };

    productions.forEach((prod) => {
      totals[prod.building.type].production += prod.hourlyProduction;
      totals[prod.building.type].capacity += prod.totalCapacity;
    });

    return totals;
  };

  const totals = calculateTotals();

  const calculateTimeToFill = (type: "iron" | "food" | "coin" | "oil") => {
    const production = totals[type].production;
    const capacity = totals[type].capacity;

    if (production <= 0 || capacity <= 0) return "N/A";

    const hours = capacity / production;

    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}j ${Math.round(hours % 24)}h`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="bg-green-50 dark:bg-green-900/30">
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Translate>🏭 Calculateur de Production de Ressources</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              <Translate>Bonus de Production</Translate>
            </label>
            <select
              value={selectedBonus}
              onChange={(e) => {
                const newBonus = parseInt(e.target.value);
                setSelectedBonus(newBonus);
                // Recalculate all productions with new bonus
                const newProductions = productions.map((prod) => {
                  const bonus = productionBonuses[newBonus].multiplier;
                  const building = prod.building;
                  return {
                    ...prod,
                    hourlyProduction:
                      (building.baseProduction +
                        building.productionPerLevel * (prod.level - 1)) *
                      prod.quantity *
                      bonus,
                  };
                });
                setProductions(newProductions);
              }}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {productionBonuses.map((bonus, index) => (
                <option key={index} value={index}>
                  {bonus.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {productions.map((prod, index) => (
              <Card
                key={index}
                className="border-gray-200 dark:border-gray-700"
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Translate>Bâtiment</Translate>
                      </label>
                      <select
                        value={buildings.findIndex(
                          (b) => b.name === prod.building.name
                        )}
                        onChange={(e) =>
                          updateProduction(
                            index,
                            "building",
                            buildings[parseInt(e.target.value)]
                          )
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                      >
                        {buildings.map((building, bIndex) => (
                          <option key={bIndex} value={bIndex}>
                            {building.name} ({building.type.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Translate>Niveau</Translate>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={prod.building.maxLevel}
                        value={prod.level}
                        onChange={(e) =>
                          updateProduction(
                            index,
                            "level",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Translate>Quantité</Translate>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={prod.quantity}
                        onChange={(e) =>
                          updateProduction(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Production/h
                      </label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded font-medium">
                        {Math.round(prod.hourlyProduction).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => removeProduction(index)}
                        className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <button
              onClick={addProduction}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-400 transition-colors text-green-600 dark:text-green-400"
            >
              + Ajouter un Bâtiment de Production
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 Résumé de Production</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                Fer
              </h3>
              <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                {Math.round(totals.iron.production).toLocaleString()}/h
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Capacité: {totals.iron.capacity.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Temps de remplissage: {calculateTimeToFill("iron")}
              </p>
            </div>

            <div className="text-center">
              <div className="text-2xl mb-2">🍖</div>
              <h3 className="font-semibold text-green-700 dark:text-green-300">
                Nourriture
              </h3>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {Math.round(totals.food.production).toLocaleString()}/h
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Capacité: {totals.food.capacity.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Temps de remplissage: {calculateTimeToFill("food")}
              </p>
            </div>

            <div className="text-center">
              <div className="text-2xl mb-2">🪙</div>
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">
                Pièces
              </h3>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {Math.round(totals.coin.production).toLocaleString()}/h
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Capacité: {totals.coin.capacity.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Temps de remplissage: {calculateTimeToFill("coin")}
              </p>
            </div>

            {totals.oil.production > 0 && (
              <div className="text-center">
                <div className="text-2xl mb-2">🛢️</div>
                <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                  Pétrole
                </h3>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(totals.oil.production).toLocaleString()}/h
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Capacité: {totals.oil.capacity.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Temps de remplissage: {calculateTimeToFill("oil")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            💡 Conseils d'Optimisation
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Équilibrez production et capacité de stockage</li>
            <li>• Placez des héros économiques pour +20% de production</li>
            <li>• Profitez des événements "Production Boost" pour +50%</li>
            <li>
              • Les technologies économiques augmentent la production de +30%
            </li>
            <li>• Le pétrole n'est disponible qu'à partir du QG niveau 31</li>
            <li>
              • Collectez régulièrement pour éviter la perte de production
            </li>
            <li>• Améliorez les entrepôts pour augmenter la capacité</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📈 Données de Production par Niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-600">
                  <th className="text-left p-2">
                    <Translate>Bâtiment</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Niv. 1</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Niv. 10</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Niv. 20</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Niv. 30</Translate>
                  </th>
                  <th className="text-left p-2">
                    <Translate>Niv. 35</Translate>
                  </th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building, index) => (
                  <tr
                    key={index}
                    className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="p-2 font-medium">
                      <Translate>{building.name}</Translate>
                    </td>
                    <td className="p-2">{building.baseProduction}/h</td>
                    <td className="p-2">
                      {building.baseProduction +
                        building.productionPerLevel * 9}
                      /h
                    </td>
                    <td className="p-2">
                      {building.baseProduction +
                        building.productionPerLevel * 19}
                      /h
                    </td>
                    <td className="p-2">
                      {building.baseProduction +
                        building.productionPerLevel * 29}
                      /h
                    </td>
                    <td className="p-2">
                      {building.baseProduction +
                        building.productionPerLevel * 34}
                      /h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
