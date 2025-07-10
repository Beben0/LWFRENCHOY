"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface ResearchTech {
  id: string;
  name: string;
  category: string;
  levels: number;
  intelPerLevel: number;
  totalIntel: number;
  powerGain: number;
  effects: string[];
  description: string;
  prerequisites?: string[];
}

// Real data from Last War research trees
const researchTechs: ResearchTech[] = [
  // Development Tree
  {
    id: "construction_speed",
    name: "Vitesse de Construction",
    category: "Développement",
    levels: 10,
    intelPerLevel: 500,
    totalIntel: 5000,
    powerGain: 800,
    effects: ["+5% vitesse construction par niveau"],
    description: "Accélère la construction de tous les bâtiments",
    prerequisites: [],
  },
  {
    id: "research_speed",
    name: "Vitesse de Recherche",
    category: "Développement",
    levels: 10,
    intelPerLevel: 750,
    totalIntel: 7500,
    powerGain: 900,
    effects: ["+5% vitesse recherche par niveau"],
    description: "Accélère toutes les recherches technologiques",
  },
  {
    id: "building_efficiency",
    name: "Efficacité des Bâtiments",
    category: "Développement",
    levels: 8,
    intelPerLevel: 1000,
    totalIntel: 8000,
    powerGain: 1200,
    effects: ["+3% efficacité bâtiments par niveau"],
    description: "Améliore le rendement de tous les bâtiments",
  },

  // Economy Tree
  {
    id: "iron_output",
    name: "Production de Fer",
    category: "Économie",
    levels: 12,
    intelPerLevel: 400,
    totalIntel: 4800,
    powerGain: 600,
    effects: ["+8% production fer par niveau"],
    description: "Augmente la production de toutes les mines de fer",
  },
  {
    id: "food_output",
    name: "Production de Nourriture",
    category: "Économie",
    levels: 12,
    intelPerLevel: 400,
    totalIntel: 4800,
    powerGain: 600,
    effects: ["+8% production nourriture par niveau"],
    description: "Augmente la production de toutes les fermes",
  },
  {
    id: "coin_production",
    name: "Production de Pièces",
    category: "Économie",
    levels: 10,
    intelPerLevel: 600,
    totalIntel: 6000,
    powerGain: 800,
    effects: ["+6% production pièces par niveau"],
    description: "Améliore les revenus en pièces",
  },
  {
    id: "resource_capacity",
    name: "Capacité de Stockage",
    category: "Économie",
    levels: 8,
    intelPerLevel: 800,
    totalIntel: 6400,
    powerGain: 1000,
    effects: ["+10% capacité stockage par niveau"],
    description: "Augmente la capacité de tous les entrepôts",
  },
  {
    id: "trade_efficiency",
    name: "Efficacité Commerciale",
    category: "Économie",
    levels: 6,
    intelPerLevel: 1200,
    totalIntel: 7200,
    powerGain: 1400,
    effects: ["+5% bonus échange par niveau"],
    description: "Améliore les échanges avec les alliés",
  },

  // Military Tree
  {
    id: "infantry_attack",
    name: "Attaque Infanterie",
    category: "Militaire",
    levels: 15,
    intelPerLevel: 800,
    totalIntel: 12000,
    powerGain: 2000,
    effects: ["+4% attaque infanterie par niveau"],
    description: "Augmente les dégâts de toute l'infanterie",
  },
  {
    id: "vehicle_defense",
    name: "Défense Véhicules",
    category: "Militaire",
    levels: 15,
    intelPerLevel: 900,
    totalIntel: 13500,
    powerGain: 2200,
    effects: ["+4% défense véhicules par niveau"],
    description: "Renforce la résistance des véhicules",
  },
  {
    id: "aircraft_hp",
    name: "PV Aéronefs",
    category: "Militaire",
    levels: 12,
    intelPerLevel: 1000,
    totalIntel: 12000,
    powerGain: 1800,
    effects: ["+5% PV aéronefs par niveau"],
    description: "Augmente les points de vie des unités aériennes",
  },
  {
    id: "march_capacity",
    name: "Capacité de Marche",
    category: "Militaire",
    levels: 8,
    intelPerLevel: 1500,
    totalIntel: 12000,
    powerGain: 2500,
    effects: ["+1000 capacité par niveau"],
    description: "Permet de déployer plus de troupes simultanément",
  },
  {
    id: "combat_boost",
    name: "Bonus de Combat",
    category: "Militaire",
    levels: 10,
    intelPerLevel: 1200,
    totalIntel: 12000,
    powerGain: 2800,
    effects: ["+3% dégâts généraux par niveau"],
    description: "Améliore tous les types de dégâts au combat",
  },

  // Defense Tree
  {
    id: "wall_durability",
    name: "Durabilité des Murs",
    category: "Défense",
    levels: 12,
    intelPerLevel: 700,
    totalIntel: 8400,
    powerGain: 1500,
    effects: ["+6% résistance murs par niveau"],
    description: "Renforce la résistance de toutes les fortifications",
  },
  {
    id: "trap_damage",
    name: "Dégâts des Pièges",
    category: "Défense",
    levels: 10,
    intelPerLevel: 900,
    totalIntel: 9000,
    powerGain: 1800,
    effects: ["+8% dégâts pièges par niveau"],
    description: "Augmente l'efficacité de tous les pièges défensifs",
  },
  {
    id: "garrison_bonus",
    name: "Bonus de Garnison",
    category: "Défense",
    levels: 8,
    intelPerLevel: 1100,
    totalIntel: 8800,
    powerGain: 2000,
    effects: ["+5% bonus défense base par niveau"],
    description: "Améliore les troupes qui défendent la base",
  },
  {
    id: "anti_scout",
    name: "Anti-Reconnaissance",
    category: "Défense",
    levels: 6,
    intelPerLevel: 1300,
    totalIntel: 7800,
    powerGain: 1600,
    effects: ["+10% résistance reconnaissance par niveau"],
    description: "Réduit les informations obtenues par les éclaireurs ennemis",
  },

  // Heroes Tree
  {
    id: "hero_exp_gain",
    name: "Gain d'EXP Héros",
    category: "Héros",
    levels: 10,
    intelPerLevel: 600,
    totalIntel: 6000,
    powerGain: 1200,
    effects: ["+8% EXP héros par niveau"],
    description: "Accélère la progression de tous les héros",
  },
  {
    id: "hero_skills",
    name: "Compétences Héroïques",
    category: "Héros",
    levels: 8,
    intelPerLevel: 1000,
    totalIntel: 8000,
    powerGain: 1800,
    effects: ["+5% efficacité compétences par niveau"],
    description: "Améliore l'effet de toutes les compétences héroïques",
  },
  {
    id: "leadership",
    name: "Leadership",
    category: "Héros",
    levels: 6,
    intelPerLevel: 1500,
    totalIntel: 9000,
    powerGain: 2200,
    effects: ["+2% bonus équipe par niveau"],
    description: "Augmente l'efficacité de toute l'équipe menée par un héros",
  },

  // Special Forces Tree
  {
    id: "elite_training",
    name: "Entraînement d'Élite",
    category: "Forces Spéciales",
    levels: 5,
    intelPerLevel: 2000,
    totalIntel: 10000,
    powerGain: 3000,
    effects: ["+6% stats unités élite par niveau"],
    description: "Améliore toutes les statistiques des unités d'élite",
  },
  {
    id: "advanced_tactics",
    name: "Tactiques Avancées",
    category: "Forces Spéciales",
    levels: 4,
    intelPerLevel: 2500,
    totalIntel: 10000,
    powerGain: 3500,
    effects: ["+4% efficacité formation par niveau"],
    description: "Améliore l'efficacité des formations de combat complexes",
  },
  {
    id: "stealth_operations",
    name: "Opérations Furtives",
    category: "Forces Spéciales",
    levels: 3,
    intelPerLevel: 3000,
    totalIntel: 9000,
    powerGain: 4000,
    effects: ["+10% chance évitement par niveau"],
    description: "Permet aux unités d'éviter plus facilement la détection",
  },

  // Age of Oil Tree (Level 31+)
  {
    id: "oil_extraction",
    name: "Extraction Pétrolière",
    category: "Ère du Pétrole",
    levels: 8,
    intelPerLevel: 3000,
    totalIntel: 24000,
    powerGain: 4500,
    effects: ["+12% production pétrole par niveau"],
    description: "Augmente drastiquement la production de pétrole",
    prerequisites: ["HQ Niveau 31"],
  },
  {
    id: "hq_expansion",
    name: "Expansion QG",
    category: "Ère du Pétrole",
    levels: 1,
    intelPerLevel: 15000,
    totalIntel: 15000,
    powerGain: 5000,
    effects: ["Débloque QG niveau 31-35"],
    description: "Permet l'amélioration du QG au-delà du niveau 30",
    prerequisites: ["Tech Center Niveau 30", "80% Forces Spéciales"],
  },
  {
    id: "advanced_weaponry",
    name: "Armement Avancé",
    category: "Ère du Pétrole",
    levels: 6,
    intelPerLevel: 4000,
    totalIntel: 24000,
    powerGain: 6000,
    effects: ["+8% dégâts armes avancées par niveau"],
    description: "Débloque et améliore les systèmes d'armement du futur",
  },
];

const categories = [
  "Tous",
  "Développement",
  "Économie",
  "Militaire",
  "Défense",
  "Héros",
  "Forces Spéciales",
  "Ère du Pétrole",
];

export default function ResearchCalculator() {
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleTech = (techId: string) => {
    const newSelected = new Set(selectedTechs);
    if (newSelected.has(techId)) {
      newSelected.delete(techId);
    } else {
      newSelected.add(techId);
    }
    setSelectedTechs(newSelected);
  };

  const filteredTechs = researchTechs.filter((tech) => {
    const matchesCategory =
      filterCategory === "Tous" || tech.category === filterCategory;
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const calculateTotals = () => {
    let totalIntel = 0;
    let totalPower = 0;
    let techCount = 0;

    selectedTechs.forEach((techId) => {
      const tech = researchTechs.find((t) => t.id === techId);
      if (tech) {
        totalIntel += tech.totalIntel;
        totalPower += tech.powerGain;
        techCount++;
      }
    });

    return { totalIntel, totalPower, techCount };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-purple-50 dark:bg-purple-900/30">
          <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
            🔬 Planificateur de Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Catégorie
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {totals.techCount > 0 && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Plan de Recherche Sélectionné
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Technologies
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {totals.techCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Intel Total
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {totals.totalIntel.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gain de Puissance
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    +{totals.totalPower.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTechs.map((tech) => {
              const isSelected = selectedTechs.has(tech.id);
              const categoryColor =
                {
                  Développement: "blue",
                  Économie: "green",
                  Militaire: "red",
                  Défense: "orange",
                  Héros: "purple",
                  "Forces Spéciales": "yellow",
                  "Ère du Pétrole": "black",
                }[tech.category] || "gray";

              return (
                <Card
                  key={tech.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? `border-${categoryColor}-400 bg-${categoryColor}-50 dark:bg-${categoryColor}-900/30`
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => toggleTech(tech.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{tech.name}</h4>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full bg-${categoryColor}-100 text-${categoryColor}-800 dark:bg-${categoryColor}-900/50 dark:text-${categoryColor}-200 mb-2`}
                        >
                          {tech.category}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 ${
                          isSelected
                            ? `border-${categoryColor}-500 bg-${categoryColor}-500`
                            : "border-gray-300 dark:border-gray-600"
                        } flex items-center justify-center`}
                      >
                        {isSelected && (
                          <span className="text-white text-sm">✓</span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {tech.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Niveaux:
                        </span>
                        <span className="font-medium ml-1">{tech.levels}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Intel total:
                        </span>
                        <span className="font-medium ml-1 text-blue-600 dark:text-blue-400">
                          {tech.totalIntel.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Par niveau:
                        </span>
                        <span className="font-medium ml-1">
                          {tech.intelPerLevel.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Puissance:
                        </span>
                        <span className="font-medium ml-1 text-green-600 dark:text-green-400">
                          +{tech.powerGain.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Effets:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {tech.effects.map((effect, index) => (
                          <li key={index}>• {effect}</li>
                        ))}
                      </ul>
                    </div>

                    {tech.prerequisites && tech.prerequisites.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                          Prérequis:
                        </p>
                        <ul className="text-xs text-orange-600 dark:text-orange-400">
                          {tech.prerequisites.map((req, index) => (
                            <li key={index}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            💡 Conseils de Recherche
          </h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Priorisez Développement et Économie en début de partie</li>
            <li>
              • Déverrouillez "Expansion QG" avant le niveau 30 pour continuer
            </li>
            <li>
              • Les recherches militaires sont essentielles pour les combats PvP
            </li>
            <li>
              • Coordonnez avec les événements "Âge de la Science" pour les
              bonus
            </li>
            <li>
              • Les Forces Spéciales nécessitent 80% d\'achèvement pour
              l\'expansion
            </li>
            <li>• L\'Ère du Pétrole débloque les technologies de fin de jeu</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
