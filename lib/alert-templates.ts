// Système de templates pour les alertes avec variables dynamiques

export interface AlertTemplate {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  defaultConditions: any;
  availableComparisons: string[];
  variables: AlertVariable[];
  messageTemplate: string;
  examples: AlertExample[];
}

export interface AlertVariable {
  key: string;
  name: string;
  description: string;
  type: "number" | "string" | "percentage" | "date" | "boolean";
  format?: string; // Format d'affichage (ex: "0,0", "0.0%", "DD/MM/YYYY")
}

export interface AlertExample {
  condition: any;
  description: string;
  messagePreview: string;
}

// Templates d'alertes avec documentation
export const ALERT_TEMPLATES: Record<string, AlertTemplate> = {
  TRAIN_COVERAGE: {
    type: "TRAIN_COVERAGE",
    name: "Couverture des Trains",
    description: "Surveille le pourcentage de créneaux de trains assignés",
    category: "Trains",
    icon: "🚂",
    defaultConditions: {
      threshold: 80,
      comparison: "less_than",
      timeframe: null,
    },
    availableComparisons: ["less_than", "greater_than", "equals"],
    variables: [
      {
        key: "coveragePercent",
        name: "Pourcentage de couverture",
        description: "Pourcentage de créneaux assignés",
        type: "percentage",
        format: "0.0%",
      },
      {
        key: "assignedSlots",
        name: "Créneaux assignés",
        description: "Nombre de créneaux avec un conducteur",
        type: "number",
        format: "0,0",
      },
      {
        key: "totalSlots",
        name: "Total créneaux",
        description: "Nombre total de créneaux de trains",
        type: "number",
        format: "0,0",
      },
      {
        key: "missingSlots",
        name: "Créneaux manquants",
        description: "Nombre de créneaux sans conducteur",
        type: "number",
        format: "0,0",
      },
    ],
    messageTemplate:
      "⚠️ Couverture des trains insuffisante !\n\n📊 **Statistiques actuelles :**\n• Couverture : {coveragePercent}\n• Créneaux assignés : {assignedSlots}/{totalSlots}\n• Créneaux manquants : {missingSlots}\n\n🎯 **Seuil configuré :** < {threshold}%",
    examples: [
      {
        condition: { threshold: 80, comparison: "less_than" },
        description: "Alerte si moins de 80% des trains sont couverts",
        messagePreview:
          "⚠️ Couverture des trains insuffisante ! Couverture : 65%",
      },
      {
        condition: { threshold: 100, comparison: "less_than" },
        description: "Alerte dès qu'un train n'a pas de conducteur",
        messagePreview:
          "⚠️ Couverture des trains insuffisante ! Couverture : 85%",
      },
    ],
  },

  INACTIVE_MEMBERS: {
    type: "INACTIVE_MEMBERS",
    name: "Membres Inactifs",
    description: "Surveille le nombre de membres inactifs depuis X jours",
    category: "Membres",
    icon: "😴",
    defaultConditions: {
      threshold: 5,
      comparison: "greater_than",
      timeframe: 7, // jours
    },
    availableComparisons: ["greater_than", "greater_than_or_equal", "equals"],
    variables: [
      {
        key: "inactiveCount",
        name: "Nombre d'inactifs",
        description: "Nombre de membres inactifs",
        type: "number",
        format: "0,0",
      },
      {
        key: "inactiveDays",
        name: "Jours d'inactivité",
        description: "Seuil de jours d'inactivité",
        type: "number",
        format: "0",
      },
      {
        key: "totalActiveMembers",
        name: "Total membres actifs",
        description: "Nombre total de membres actifs",
        type: "number",
        format: "0,0",
      },
      {
        key: "inactivePercent",
        name: "Pourcentage d'inactifs",
        description: "Pourcentage de membres inactifs",
        type: "percentage",
        format: "0.0%",
      },
    ],
    messageTemplate:
      "😴 **Membres inactifs détectés !**\n\n📊 **Détails :**\n• {inactiveCount} membre(s) inactif(s) depuis plus de {inactiveDays} jours\n• {inactivePercent}% des membres actifs\n• Total membres actifs : {totalActiveMembers}\n\n🎯 **Seuil configuré :** > {threshold} membres",
    examples: [
      {
        condition: { threshold: 5, comparison: "greater_than", timeframe: 7 },
        description: "Alerte si plus de 5 membres sont inactifs depuis 7 jours",
        messagePreview:
          "😴 Membres inactifs détectés ! 8 membres inactifs depuis plus de 7 jours",
      },
      {
        condition: { threshold: 3, comparison: "greater_than", timeframe: 14 },
        description:
          "Alerte si plus de 3 membres sont inactifs depuis 14 jours",
        messagePreview:
          "😴 Membres inactifs détectés ! 5 membres inactifs depuis plus de 14 jours",
      },
    ],
  },

  MISSING_CONDUCTOR: {
    type: "MISSING_CONDUCTOR",
    name: "Conducteurs Manquants",
    description: "Alerte quand des créneaux n'ont pas de conducteur",
    category: "Trains",
    icon: "👤",
    defaultConditions: {
      threshold: 0,
      comparison: "greater_than",
      timeframe: null,
    },
    availableComparisons: ["greater_than", "greater_than_or_equal", "equals"],
    variables: [
      {
        key: "missingConductors",
        name: "Conducteurs manquants",
        description: "Nombre de créneaux sans conducteur",
        type: "number",
        format: "0,0",
      },
      {
        key: "totalSlots",
        name: "Total créneaux",
        description: "Nombre total de créneaux",
        type: "number",
        format: "0,0",
      },
      {
        key: "missingDays",
        name: "Jours concernés",
        description: "Liste des jours sans conducteur",
        type: "string",
      },
    ],
    messageTemplate:
      "👤 **Conducteurs manquants !**\n\n🚂 **Créneaux sans conducteur :**\n• {missingConductors} créneau(x) sur {totalSlots}\n• Jours concernés : {missingDays}\n\n⚡ **Action requise :** Assigner des conducteurs rapidement",
    examples: [
      {
        condition: { threshold: 0, comparison: "greater_than" },
        description: "Alerte dès qu'un créneau n'a pas de conducteur",
        messagePreview: "👤 Conducteurs manquants ! 2 créneaux sans conducteur",
      },
    ],
  },

  MEMBER_THRESHOLD: {
    type: "MEMBER_THRESHOLD",
    name: "Seuil de Membres",
    description: "Surveille le nombre total de membres actifs",
    category: "Membres",
    icon: "👥",
    defaultConditions: {
      threshold: 50,
      comparison: "less_than",
      timeframe: null,
    },
    availableComparisons: ["less_than", "greater_than", "equals"],
    variables: [
      {
        key: "activeMembers",
        name: "Membres actifs",
        description: "Nombre de membres actifs",
        type: "number",
        format: "0,0",
      },
      {
        key: "maxMembers",
        name: "Limite alliance",
        description: "Limite maximale de l'alliance",
        type: "number",
        format: "0,0",
      },
      {
        key: "memberPercent",
        name: "Pourcentage de remplissage",
        description: "Pourcentage de l'alliance remplie",
        type: "percentage",
        format: "0.0%",
      },
    ],
    messageTemplate:
      "👥 **Seuil de membres atteint !**\n\n📊 **Effectifs actuels :**\n• Membres actifs : {activeMembers}\n• Limite alliance : {maxMembers}\n• Taux de remplissage : {memberPercent}%\n\n🎯 **Seuil configuré :** {comparison} {threshold} membres",
    examples: [
      {
        condition: { threshold: 50, comparison: "less_than" },
        description: "Alerte si moins de 50 membres actifs",
        messagePreview: "👥 Seuil de membres atteint ! 45 membres actifs",
      },
      {
        condition: { threshold: 90, comparison: "greater_than" },
        description: "Alerte si plus de 90 membres (alliance presque pleine)",
        messagePreview: "👥 Seuil de membres atteint ! 95 membres actifs",
      },
    ],
  },

  POWER_THRESHOLD: {
    type: "POWER_THRESHOLD",
    name: "Seuil de Puissance",
    description: "Surveille la puissance totale de l'alliance",
    category: "Alliance",
    icon: "⚡",
    defaultConditions: {
      threshold: 1000000000, // 1 milliard
      comparison: "less_than",
      timeframe: null,
    },
    availableComparisons: ["less_than", "greater_than", "equals"],
    variables: [
      {
        key: "totalPower",
        name: "Puissance totale",
        description: "Puissance totale de l'alliance",
        type: "number",
        format: "0,0",
      },
      {
        key: "averagePower",
        name: "Puissance moyenne",
        description: "Puissance moyenne par membre",
        type: "number",
        format: "0,0",
      },
      {
        key: "activeMembers",
        name: "Membres actifs",
        description: "Nombre de membres actifs",
        type: "number",
        format: "0,0",
      },
      {
        key: "powerGrowth",
        name: "Croissance",
        description: "Évolution de puissance (si disponible)",
        type: "string",
      },
    ],
    messageTemplate:
      "⚡ **Seuil de puissance atteint !**\n\n💪 **Statistiques de puissance :**\n• Puissance totale : {totalPower:0,0}\n• Puissance moyenne : {averagePower:0,0} par membre\n• Membres actifs : {activeMembers}\n\n🎯 **Seuil configuré :** {comparison} {threshold:0,0}",
    examples: [
      {
        condition: { threshold: 1000000000, comparison: "greater_than" },
        description: "Alerte quand l'alliance dépasse 1 milliard de puissance",
        messagePreview:
          "⚡ Seuil de puissance atteint ! Puissance totale : 1,200,000,000",
      },
      {
        condition: { threshold: 500000000, comparison: "less_than" },
        description: "Alerte si l'alliance descend sous 500 millions",
        messagePreview:
          "⚡ Seuil de puissance atteint ! Puissance totale : 450,000,000",
      },
    ],
  },

  EVENT_REMINDER: {
    type: "EVENT_REMINDER",
    name: "Rappel d'Événement",
    description: "Rappels avant les événements importants",
    category: "Événements",
    icon: "📅",
    defaultConditions: {
      threshold: 2, // heures avant
      comparison: "equals",
      timeframe: 24, // chercher dans les prochaines 24h
    },
    availableComparisons: ["equals", "less_than_or_equal"],
    variables: [
      {
        key: "eventTitle",
        name: "Nom de l'événement",
        description: "Titre de l'événement",
        type: "string",
      },
      {
        key: "eventType",
        name: "Type d'événement",
        description: "Catégorie de l'événement",
        type: "string",
      },
      {
        key: "timeUntilEvent",
        name: "Temps restant",
        description: "Temps avant l'événement",
        type: "string",
      },
      {
        key: "eventDate",
        name: "Date de l'événement",
        description: "Date et heure de l'événement",
        type: "date",
        format: "DD/MM/YYYY HH:mm",
      },
    ],
    messageTemplate:
      "📅 **Rappel d'Événement !**\n\n🎯 **{eventTitle}**\n• Type : {eventType}\n• Début : {eventDate}\n• Dans : {timeUntilEvent}\n\n⚠️ **Préparez-vous !** L'événement commence bientôt.",
    examples: [
      {
        condition: { threshold: 2, comparison: "equals", timeframe: 24 },
        description: "Rappel 2 heures avant chaque événement",
        messagePreview:
          "📅 Rappel d'Événement ! Guerre d'Alliance dans 2 heures",
      },
      {
        condition: {
          threshold: 30,
          comparison: "less_than_or_equal",
          timeframe: 60,
        },
        description: "Rappel 30 minutes avant chaque événement",
        messagePreview: "📅 Rappel d'Événement ! Boss Fight dans 15 minutes",
      },
    ],
  },

  TRAIN_DEPARTURE: {
    type: "TRAIN_DEPARTURE",
    name: "Départ de Train",
    description: "Alerte X minutes avant le départ d'un train",
    category: "Trains",
    icon: "🚀",
    defaultConditions: {
      threshold: 1,
      comparison: "greater_than_or_equal",
      minutesBefore: 30,
    },
    availableComparisons: ["greater_than_or_equal", "greater_than", "equals"],
    variables: [
      {
        key: "trainCount",
        name: "Nombre de trains",
        description: "Nombre de trains qui partent bientôt",
        type: "number",
        format: "0",
      },
      {
        key: "minutesBefore",
        name: "Minutes d'avance",
        description: "Nombre de minutes avant le départ",
        type: "number",
        format: "0",
      },
      {
        key: "trainsList",
        name: "Liste des trains",
        description: "Détails des trains qui partent",
        type: "string",
      },
      {
        key: "nextTrains",
        name: "Prochains trains",
        description: "Horaires des prochains trains",
        type: "string",
      },
    ],
    messageTemplate:
      "🚀 **Départ de train imminent !**\n\n🚂 **Trains concernés :**\n{trainsList}\n\n⏰ **Dans {minutesBefore} minutes ou moins**\n\n🎯 **Préparez-vous pour le départ !**",
    examples: [
      {
        condition: {
          threshold: 1,
          comparison: "greater_than_or_equal",
          minutesBefore: 30,
        },
        description: "Alerte 30 minutes avant le départ d'un train",
        messagePreview:
          "🚀 Départ de train imminent ! Conductor123 (lundi 20:00 - dans 25min)",
      },
      {
        condition: {
          threshold: 1,
          comparison: "greater_than_or_equal",
          minutesBefore: 15,
        },
        description: "Alerte 15 minutes avant le départ",
        messagePreview:
          "🚀 Départ de train imminent ! Conductor456 (mardi 14:00 - dans 10min)",
      },
    ],
  },

  MANUAL_MESSAGE: {
    type: "MANUAL_MESSAGE",
    name: "Message Manuel",
    description: "Envoi d'un message personnalisé avec un niveau d'alerte",
    category: "Communication",
    icon: "📢",
    defaultConditions: {
      threshold: true,
      comparison: "equals",
      message: "",
      title: "Notification",
    },
    availableComparisons: ["equals"],
    variables: [
      {
        key: "message",
        name: "Message",
        description: "Contenu du message personnalisé",
        type: "string",
      },
      {
        key: "title",
        name: "Titre",
        description: "Titre de la notification",
        type: "string",
      },
    ],
    messageTemplate: "📢 **{title}**\n\n{message}",
    examples: [
      {
        condition: {
          message: "Maintenance serveur prévue demain 14h",
          title: "Maintenance",
        },
        description: "Message de maintenance",
        messagePreview:
          "📢 Maintenance - Maintenance serveur prévue demain 14h",
      },
      {
        condition: {
          message: "Nouvelle version déployée avec succès !",
          title: "Déploiement",
        },
        description: "Message de déploiement",
        messagePreview:
          "📢 Déploiement - Nouvelle version déployée avec succès !",
      },
    ],
  },
};

// Fonction pour remplacer les variables dans un template
export function replaceVariables(
  template: string,
  variables: Record<string, any>,
  conditions?: any
): string {
  let result = template;

  // Remplacer les variables de données
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}(?::[^}]+)?}`, "g");
    result = result.replace(regex, formatValue(value, key));
  });

  // Remplacer les variables de conditions
  if (conditions) {
    Object.entries(conditions).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}(?::[^}]+)?}`, "g");
      result = result.replace(regex, formatValue(value, key));
    });

    // Remplacer la comparaison par un texte lisible
    if (conditions.comparison) {
      const comparisonText = getComparisonText(conditions.comparison);
      result = result.replace(/{comparison}/g, comparisonText);
    }
  }

  return result;
}

// Formater une valeur selon son type
function formatValue(value: any, key: string): string {
  if (value === null || value === undefined) return "N/A";

  // Déterminer le type de formatage selon la clé
  if (key.includes("Percent") || key.includes("percent")) {
    return `${Number(value).toFixed(1)}%`;
  }

  if (key.includes("Power") || key.includes("power")) {
    return Number(value).toLocaleString();
  }

  if (key.includes("Date") || key.includes("date")) {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return String(value);
}

// Convertir les comparaisons en texte lisible
function getComparisonText(comparison: string): string {
  const texts: Record<string, string> = {
    less_than: "inférieur à",
    greater_than: "supérieur à",
    equals: "égal à",
    less_than_or_equal: "inférieur ou égal à",
    greater_than_or_equal: "supérieur ou égal à",
  };

  return texts[comparison] || comparison;
}

// Obtenir les comparaisons disponibles avec leurs labels
export function getAvailableComparisons() {
  return [
    { value: "less_than", label: "Inférieur à (<)" },
    { value: "greater_than", label: "Supérieur à (>)" },
    { value: "equals", label: "Égal à (=)" },
    { value: "less_than_or_equal", label: "Inférieur ou égal à (≤)" },
    { value: "greater_than_or_equal", label: "Supérieur ou égal à (≥)" },
  ];
}

// Valider une condition
export function validateCondition(type: string, conditions: any): string[] {
  const template = ALERT_TEMPLATES[type];
  if (!template) return ["Type d'alerte invalide"];

  const errors: string[] = [];

  if (typeof conditions.threshold === "undefined") {
    errors.push("Seuil requis");
  }

  if (!conditions.comparison) {
    errors.push("Comparaison requise");
  } else if (!template.availableComparisons.includes(conditions.comparison)) {
    errors.push("Comparaison non supportée pour ce type d'alerte");
  }

  return errors;
}
