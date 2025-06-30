import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPower(power: bigint | number): string {
  const powerNum = typeof power === "bigint" ? Number(power) : power;

  if (powerNum >= 1000000) {
    return `${(powerNum / 1000000).toFixed(1)}M`;
  } else if (powerNum >= 1000) {
    return `${(powerNum / 1000).toFixed(1)}K`;
  }
  return powerNum.toString();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

// Fonction pour convertir les BigInt en chaînes pour la sérialisation JSON
export function jsonify(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return data.toString();
  }

  // Convertir les objets Date en chaînes ISO pour éviter les "Invalid Date" côté client
  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map((item) => jsonify(item));
  }

  if (typeof data === "object") {
    const result: { [key: string]: any } = {};
    for (const key in data) {
      result[key] = jsonify(data[key]);
    }
    return result;
  }

  return data;
}
