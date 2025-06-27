import { getReferenceOptions } from "./reference-data";

// Cache simple pour éviter les requêtes répétées
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedOptions(category: string) {
  const cacheKey = `ref_${category}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await getReferenceOptions(category as any);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Spécialités des membres
export async function getMemberSpecialties() {
  return await getCachedOptions("MEMBER_SPECIALTY");
}

// Tags des membres
export async function getMemberTags() {
  return await getCachedOptions("MEMBER_TAG");
}

// Rôles d'alliance
export async function getAllianceRoles() {
  return await getCachedOptions("ALLIANCE_ROLE");
}

// Types d'événements
export async function getEventTypes() {
  return await getCachedOptions("EVENT_TYPE");
}

// Tags des événements
export async function getEventTags() {
  return await getCachedOptions("EVENT_TAG");
}

// Types de trains
export async function getTrainTypes() {
  return await getCachedOptions("TRAIN_TYPE");
}

// Niveaux de priorité
export async function getPriorityLevels() {
  return await getCachedOptions("PRIORITY_LEVEL");
}

// Types de statuts
export async function getStatusTypes() {
  return await getCachedOptions("STATUS_TYPE");
}

// Fonction pour invalider le cache (à appeler après modification des référentiels)
export function invalidateReferenceCache() {
  cache.clear();
}

// Fonctions pour récupérer les libellés
export async function getSpecialtyLabel(key: string): Promise<string> {
  const options = await getMemberSpecialties();
  return options.find((opt: any) => opt.value === key)?.label || key;
}

export async function getAllianceRoleLabel(key: string): Promise<string> {
  const options = await getAllianceRoles();
  return options.find((opt: any) => opt.value === key)?.label || key;
}

export async function getEventTypeLabel(key: string): Promise<string> {
  const options = await getEventTypes();
  return options.find((opt: any) => opt.value === key)?.label || key;
}

export async function getStatusLabel(key: string): Promise<string> {
  const options = await getStatusTypes();
  return options.find((opt: any) => opt.value === key)?.label || key;
}
