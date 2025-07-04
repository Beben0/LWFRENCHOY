import type { Session } from "next-auth";
import { prisma } from "./prisma";

export type UserRole = "ADMIN" | "GUEST";
export type Permission =
  // Navigation permissions
  | "view_dashboard"
  | "view_members"
  | "view_trains"
  | "view_events"
  | "view_stats"
  | "view_admin_panel"
  | "view_help"
  | "view_vs"
  | "view_desert_storm"
  | "view_calculator"

  // CRUD permissions
  | "create_member"
  | "edit_member"
  | "delete_member"
  | "create_train_slot"
  | "edit_train_slot"
  | "delete_train_slot"
  | "create_event"
  | "edit_event"
  | "delete_event"

  // Help articles permissions
  | "create_help_article"
  | "edit_help_article"
  | "delete_help_article"
  | "publish_help_article"
  | "manage_help_categories"

  // VS permissions
  | "create_vs_week"
  | "edit_vs_week"
  | "delete_vs_week"
  | "manage_vs_participants"
  | "edit_vs_results"
  | "edit_vs"

  // Desert Storm permissions
  | "create_desert_storm"
  | "edit_desert_storm"
  | "delete_desert_storm"
  | "manage_desert_storm_participants"
  | "edit_desert_storm_results"

  // Calculator permissions
  | "use_calculator"
  | "manage_calculator_presets"
  | "export_calculator_results"

  // Admin permissions
  | "manage_users"
  | "manage_permissions"
  | "export_data"
  | "import_data"
  | "manage_alerts"
  | "manage_notifications";

// Cache des permissions avec timestamp plus long (5 minutes)
let rolePermissionsCache: Record<string, Set<Permission>> | null = null;
let permissionsCacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes au lieu de 1 minute

// Permissions par défaut pour fallback (si problème avec la base de données)
const FALLBACK_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Accès complet
    "view_dashboard",
    "view_members",
    "view_trains",
    "view_events",
    "view_stats",
    "view_admin_panel",
    "view_help",
    "view_vs",
    "view_desert_storm",
    "view_calculator",
    "create_member",
    "edit_member",
    "delete_member",
    "create_train_slot",
    "edit_train_slot",
    "delete_train_slot",
    "create_event",
    "edit_event",
    "delete_event",
    "create_help_article",
    "edit_help_article",
    "delete_help_article",
    "publish_help_article",
    "manage_help_categories",
    "create_vs_week",
    "edit_vs_week",
    "delete_vs_week",
    "manage_vs_participants",
    "edit_vs_results",
    "edit_vs",
    "create_desert_storm",
    "edit_desert_storm",
    "delete_desert_storm",
    "manage_desert_storm_participants",
    "edit_desert_storm_results",
    "use_calculator",
    "manage_calculator_presets",
    "export_calculator_results",
    "manage_users",
    "manage_permissions",
    "export_data",
    "import_data",
    "manage_alerts",
    "manage_notifications",
  ],
  GUEST: [
    // Aucun accès par défaut, doit être défini en base
  ],
};

// Charger les permissions depuis la base de données avec cache
async function getRolePermissionsFromDB(): Promise<
  Record<string, Set<Permission>>
> {
  const now = Date.now();

  // Vérifier le cache
  if (
    rolePermissionsCache &&
    now - permissionsCacheTimestamp < CACHE_DURATION
  ) {
    return rolePermissionsCache;
  }

  try {
    // Utiliser l'instance singleton de Prisma
    const allRolePermissions = await prisma.rolePermission.findMany({
      where: {
        isEnabled: true,
      },
      select: {
        roleType: true,
        permission: true,
      },
    });

    // Récupérer la liste des rôles ayant au moins UNE entrée (enabled ou non)
    const rolesWithAnyEntryRows = await prisma.rolePermission.findMany({
      select: { roleType: true },
    });

    const rolesWithAnyEntrySet = new Set<string>(
      rolesWithAnyEntryRows.map((r) => r.roleType)
    );

    // Organiser par type de rôle
    const permissions: Record<string, Set<Permission>> = {};

    // Helper pour assurer un Set existant
    const ensureSet = (role: string) => {
      if (!permissions[role]) permissions[role] = new Set();
      return permissions[role]!;
    };

    allRolePermissions.forEach(({ roleType, permission }) => {
      ensureSet(roleType).add(permission as Permission);
    });

    // Appliquer les permissions de secours seulement si aucune entrée DB pour le rôle
    const applyFallbackIfEmpty = (
      role: UserRole,
      fallbackPerms: Permission[]
    ) => {
      if (!permissions[role] || permissions[role].size === 0) {
        permissions[role] = new Set(fallbackPerms);
      }
    };

    if (!rolesWithAnyEntrySet.has("ADMIN")) {
      applyFallbackIfEmpty("ADMIN", FALLBACK_ROLE_PERMISSIONS.ADMIN);
    }
    if (!rolesWithAnyEntrySet.has("GUEST")) {
      applyFallbackIfEmpty("GUEST", FALLBACK_ROLE_PERMISSIONS.GUEST);
    }

    // Mettre à jour le cache
    rolePermissionsCache = permissions;
    permissionsCacheTimestamp = now;

    return permissions;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des permissions depuis la DB:",
      error
    );

    // Fallback : permissions par défaut
    const fallbackPermissions: Record<string, Set<Permission>> = {
      ADMIN: new Set(FALLBACK_ROLE_PERMISSIONS.ADMIN),
      GUEST: new Set(),
    };

    return fallbackPermissions;
  }
}

// Version synchrone pour les cas où on a déjà les permissions en cache
function getRolePermissionsSync(): Record<string, Set<Permission>> {
  if (rolePermissionsCache) {
    return rolePermissionsCache;
  }

  // Fallback synchrone
  return {
    ADMIN: new Set(FALLBACK_ROLE_PERMISSIONS.ADMIN),
    GUEST: new Set(),
  };
}

// Obtenir les permissions combinées d'un utilisateur
async function getUserCombinedPermissions(
  session: Session | null
): Promise<Set<Permission>> {
  if (!session || !session.user) {
    // Visiteur non connecté -> permissions GUEST
    const rolePermissions = await getRolePermissionsFromDB();
    return new Set(rolePermissions.GUEST);
  }

  const rolePermissions = await getRolePermissionsFromDB();
  const combinedPermissions = new Set<Permission>();

  // Ajouter les permissions du rôle administratif
  const adminRole = session.user?.role as string;
  if (adminRole && rolePermissions[adminRole]) {
    rolePermissions[adminRole].forEach((p) => combinedPermissions.add(p));
  }

  // Ajouter les permissions du rôle d'alliance si présent
  const allianceRole = (session.user as any)?.member?.allianceRole;
  if (allianceRole && rolePermissions[allianceRole]) {
    rolePermissions[allianceRole].forEach((p) => combinedPermissions.add(p));
  }

  return combinedPermissions;
}

// Version synchrone des permissions combinées
function getUserCombinedPermissionsSync(
  session: Session | null
): Set<Permission> {
  if (!session || !session.user) {
    const rolePermissions = getRolePermissionsSync();
    return new Set(rolePermissions.GUEST);
  }

  const rolePermissions = getRolePermissionsSync();
  const combinedPermissions = new Set<Permission>();

  // Ajouter les permissions du rôle administratif
  const adminRole = session.user?.role as string;
  if (adminRole && rolePermissions[adminRole]) {
    rolePermissions[adminRole].forEach((p) => combinedPermissions.add(p));
  }

  // Ajouter les permissions du rôle d'alliance si présent
  const allianceRole = (session.user as any)?.member?.allianceRole;
  if (allianceRole && rolePermissions[allianceRole]) {
    rolePermissions[allianceRole].forEach((p) => combinedPermissions.add(p));
  }

  return combinedPermissions;
}

// Déterminer le rôle d'un utilisateur (rôle administratif principal)
export function getUserRole(session: Session | null): UserRole {
  if (!session || !session.user) return "GUEST";

  // Rôle administratif
  if (session.user?.role === "ADMIN") return "ADMIN";

  // Les autres utilisateurs connectés sont GUEST par défaut
  return "GUEST";
}

// Vérifier si un utilisateur a une permission (version asynchrone)
export async function hasPermissionAsync(
  session: Session | null,
  permission: Permission
): Promise<boolean> {
  const userPermissions = await getUserCombinedPermissions(session);
  return userPermissions.has(permission);
}

// Vérifier si un utilisateur a une permission (version synchrone avec cache/fallback)
export function hasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  // Si les permissions sont déjà dans la session, les utiliser
  if (session?.user?.permissions) {
    return session.user.permissions.includes(permission);
  }

  // Sinon, fallback sur la méthode synchrone
  const userPermissions = getUserCombinedPermissionsSync(session);
  return userPermissions.has(permission);
}

// Vérifier si un utilisateur a toutes les permissions dans une liste
export function hasAllPermissions(
  session: Session | null,
  permissions: Permission[]
): boolean {
  // Si les permissions sont déjà dans la session, les utiliser
  if (session?.user?.permissions) {
    return permissions.every((p) => session.user.permissions!.includes(p));
  }

  // Sinon, fallback sur la méthode synchrone
  const userPermissions = getUserCombinedPermissionsSync(session);
  return permissions.every((p) => userPermissions.has(p));
}

// Vérifier si un utilisateur a au moins une des permissions dans une liste
export function hasAnyPermission(
  session: Session | null,
  permissions: Permission[]
): boolean {
  // Si les permissions sont déjà dans la session, les utiliser
  if (session?.user?.permissions) {
    return permissions.some((p) => session.user.permissions!.includes(p));
  }

  // Sinon, fallback sur la méthode synchrone
  const userPermissions = getUserCombinedPermissionsSync(session);
  return permissions.some((p) => userPermissions.has(p));
}

// Obtenir toutes les permissions d'un utilisateur (version synchrone)
export function getUserPermissions(session: Session | null): Permission[] {
  // Si les permissions sont déjà dans la session, les utiliser
  if (session?.user?.permissions) {
    return session.user.permissions as Permission[];
  }

  // Sinon, fallback sur la méthode synchrone
  const userPermissions = getUserCombinedPermissionsSync(session);
  return Array.from(userPermissions);
}

// Obtenir toutes les permissions d'un utilisateur (version asynchrone)
export async function getUserPermissionsAsync(
  session: Session | null
): Promise<Permission[]> {
  const userPermissions = await getUserCombinedPermissions(session);
  return Array.from(userPermissions);
}

// Précharger les permissions pour optimiser les performances
export async function preloadPermissions(): Promise<void> {
  await getRolePermissionsFromDB();
}

// Vérifier si un utilisateur est administrateur
export function isAdmin(session: Session | null): boolean {
  return getUserRole(session) === "ADMIN";
}

// Vérifier si un utilisateur est authentifié
export function isAuthenticated(session: Session | null): boolean {
  return session !== null && session.user !== null;
}
