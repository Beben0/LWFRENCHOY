// Configuration centralisée des créneaux horaires des trains
export interface TimeSlot {
  value: string; // Heure d'inscription (exemple: "08:30")
  label: string; // Libellé affiché (exemple: "08h30 → Départ 12h30")
  category: "matin" | "midi" | "apres-midi" | "soir" | "nuit";
  realDepartureTime: string; // Heure réelle de départ (+4h)
}

export const TIME_SLOTS: TimeSlot[] = [
  // Créneaux du matin (6h-12h)
  {
    value: "06:00",
    label: "06h00 → Départ 10h00 (Matin très tôt)",
    category: "matin",
    realDepartureTime: "10:00",
  },
  {
    value: "06:30",
    label: "06h30 → Départ 10h30 (Matin très tôt)",
    category: "matin",
    realDepartureTime: "10:30",
  },
  {
    value: "07:00",
    label: "07h00 → Départ 11h00 (Matin tôt)",
    category: "matin",
    realDepartureTime: "11:00",
  },
  {
    value: "07:30",
    label: "07h30 → Départ 11h30 (Matin tôt)",
    category: "matin",
    realDepartureTime: "11:30",
  },
  {
    value: "08:00",
    label: "08h00 → Départ 12h00 (Matin)",
    category: "matin",
    realDepartureTime: "12:00",
  },
  {
    value: "08:30",
    label: "08h30 → Départ 12h30 (Matin)",
    category: "matin",
    realDepartureTime: "12:30",
  },
  {
    value: "09:00",
    label: "09h00 → Départ 13h00 (Matinée)",
    category: "matin",
    realDepartureTime: "13:00",
  },
  {
    value: "09:30",
    label: "09h30 → Départ 13h30 (Matinée)",
    category: "matin",
    realDepartureTime: "13:30",
  },
  {
    value: "10:00",
    label: "10h00 → Départ 14h00 (Matinée)",
    category: "matin",
    realDepartureTime: "14:00",
  },
  {
    value: "10:30",
    label: "10h30 → Départ 14h30 (Matinée)",
    category: "matin",
    realDepartureTime: "14:30",
  },
  {
    value: "11:00",
    label: "11h00 → Départ 15h00 (Fin matinée)",
    category: "matin",
    realDepartureTime: "15:00",
  },
  {
    value: "11:30",
    label: "11h30 → Départ 15h30 (Fin matinée)",
    category: "matin",
    realDepartureTime: "15:30",
  },

  // Créneaux du midi (12h-14h)
  {
    value: "12:00",
    label: "12h00 → Départ 16h00 (Midi)",
    category: "midi",
    realDepartureTime: "16:00",
  },
  {
    value: "12:30",
    label: "12h30 → Départ 16h30 (Midi)",
    category: "midi",
    realDepartureTime: "16:30",
  },
  {
    value: "13:00",
    label: "13h00 → Départ 17h00 (Début après-midi)",
    category: "midi",
    realDepartureTime: "17:00",
  },
  {
    value: "13:30",
    label: "13h30 → Départ 17h30 (Début après-midi)",
    category: "midi",
    realDepartureTime: "17:30",
  },

  // Créneaux de l'après-midi (14h-18h)
  {
    value: "14:00",
    label: "14h00 → Départ 18h00 (Après-midi)",
    category: "apres-midi",
    realDepartureTime: "18:00",
  },
  {
    value: "14:30",
    label: "14h30 → Départ 18h30 (Après-midi)",
    category: "apres-midi",
    realDepartureTime: "18:30",
  },
  {
    value: "15:00",
    label: "15h00 → Départ 19h00 (Après-midi)",
    category: "apres-midi",
    realDepartureTime: "19:00",
  },
  {
    value: "15:30",
    label: "15h30 → Départ 19h30 (Après-midi)",
    category: "apres-midi",
    realDepartureTime: "19:30",
  },
  {
    value: "16:00",
    label: "16h00 → Départ 20h00 (Fin après-midi)",
    category: "apres-midi",
    realDepartureTime: "20:00",
  },
  {
    value: "16:30",
    label: "16h30 → Départ 20h30 (Fin après-midi)",
    category: "apres-midi",
    realDepartureTime: "20:30",
  },
  {
    value: "17:00",
    label: "17h00 → Départ 21h00 (Fin après-midi)",
    category: "apres-midi",
    realDepartureTime: "21:00",
  },
  {
    value: "17:30",
    label: "17h30 → Départ 21h30 (Fin après-midi)",
    category: "apres-midi",
    realDepartureTime: "21:30",
  },

  // Créneaux du soir (18h-22h)
  {
    value: "18:00",
    label: "18h00 → Départ 22h00 (Soirée)",
    category: "soir",
    realDepartureTime: "22:00",
  },
  {
    value: "18:30",
    label: "18h30 → Départ 22h30 (Soirée)",
    category: "soir",
    realDepartureTime: "22:30",
  },
  {
    value: "19:00",
    label: "19h00 → Départ 23h00 (Soirée)",
    category: "soir",
    realDepartureTime: "23:00",
  },
  {
    value: "19:30",
    label: "19h30 → Départ 23h30 (Soirée)",
    category: "soir",
    realDepartureTime: "23:30",
  },
  {
    value: "20:00",
    label: "20h00 → Départ 00h00 (Soir)",
    category: "soir",
    realDepartureTime: "00:00",
  },
  {
    value: "20:30",
    label: "20h30 → Départ 00h30 (Soir)",
    category: "soir",
    realDepartureTime: "00:30",
  },
  {
    value: "21:00",
    label: "21h00 → Départ 01h00 (Soir tardif)",
    category: "soir",
    realDepartureTime: "01:00",
  },
  {
    value: "21:30",
    label: "21h30 → Départ 01h30 (Soir tardif)",
    category: "soir",
    realDepartureTime: "01:30",
  },

  // Créneaux de nuit (22h-6h)
  {
    value: "22:00",
    label: "22h00 → Départ 02h00 (Nuit)",
    category: "nuit",
    realDepartureTime: "02:00",
  },
  {
    value: "22:30",
    label: "22h30 → Départ 02h30 (Nuit)",
    category: "nuit",
    realDepartureTime: "02:30",
  },
  {
    value: "23:00",
    label: "23h00 → Départ 03h00 (Nuit tardive)",
    category: "nuit",
    realDepartureTime: "03:00",
  },
  {
    value: "23:30",
    label: "23h30 → Départ 03h30 (Nuit tardive)",
    category: "nuit",
    realDepartureTime: "03:30",
  },
  {
    value: "00:00",
    label: "00h00 → Départ 04h00 (Minuit)",
    category: "nuit",
    realDepartureTime: "04:00",
  },
  {
    value: "00:30",
    label: "00h30 → Départ 04h30 (Minuit)",
    category: "nuit",
    realDepartureTime: "04:30",
  },
  {
    value: "01:00",
    label: "01h00 → Départ 05h00 (Nuit très tardive)",
    category: "nuit",
    realDepartureTime: "05:00",
  },
  {
    value: "01:30",
    label: "01h30 → Départ 05h30 (Nuit très tardive)",
    category: "nuit",
    realDepartureTime: "05:30",
  },
];

// Créneaux populaires (les plus utilisés)
export const POPULAR_TIME_SLOTS = [
  "08:00",
  "12:00",
  "16:00",
  "20:00", // Créneaux classiques
  "08:30",
  "14:30",
  "18:30",
  "20:30", // Demi-heures populaires
];

// Obtenir un créneau par sa valeur
export function getTimeSlot(value: string): TimeSlot | undefined {
  return TIME_SLOTS.find((slot) => slot.value === value);
}

// Obtenir tous les créneaux d'une catégorie
export function getTimeSlotsByCategory(
  category: TimeSlot["category"]
): TimeSlot[] {
  return TIME_SLOTS.filter((slot) => slot.category === category);
}

// Calculer l'heure réelle de départ (+4h)
export function calculateRealDepartureTime(inscriptionTime: string): string {
  const [hours, minutes] = inscriptionTime.split(":").map(Number);
  let realHours = (hours + 4) % 24;

  return `${realHours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Obtenir le label d'affichage pour un créneau
export function getTimeSlotLabel(value: string): string {
  const slot = getTimeSlot(value);
  return slot
    ? slot.label
    : `${value} → Départ ${calculateRealDepartureTime(value)}`;
}

// Créneaux par catégorie pour l'affichage groupé
export const TIME_SLOTS_BY_CATEGORY = {
  matin: getTimeSlotsByCategory("matin"),
  midi: getTimeSlotsByCategory("midi"),
  "apres-midi": getTimeSlotsByCategory("apres-midi"),
  soir: getTimeSlotsByCategory("soir"),
  nuit: getTimeSlotsByCategory("nuit"),
};

// Labels des catégories
export const CATEGORY_LABELS = {
  matin: "🌅 Matin (6h-12h)",
  midi: "☀️ Midi (12h-14h)",
  "apres-midi": "🌞 Après-midi (14h-18h)",
  soir: "🌆 Soir (18h-22h)",
  nuit: "�� Nuit (22h-6h)",
};
