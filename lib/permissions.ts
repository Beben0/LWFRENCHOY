import { PrismaClient } from "@prisma/client";
import { Session } from "next-auth";

export type UserRole = "ADMIN" | "MEMBER" | "GUEST";
export type Permission =
  // Navigation permissions
  | "view_dashboard"
  | "view_members"
  | "view_trains"
  | "view_events"
  | "view_stats"
  | "view_admin_panel"

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

  // Admin permissions
  | "manage_users"
  | "manage_permissions"
  | "export_data"
  | "import_data"
  | "manage_alerts"
  | "manage_notifications";

// Cache pour les permissions de tous les rôles (admin + alliance)
let rolePermissionsCache: Record<string, Set<Permission>> | null = null;
let permissionsCacheTimestamp = 0;
const PERMISSIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    "create_member",
    "edit_member",
    "delete_member",
    "create_train_slot",
    "edit_train_slot",
    "delete_train_slot",
    "create_event",
    "edit_event",
    "delete_event",
    "manage_users",
    "manage_permissions",
    "export_data",
    "import_data",
    "manage_alerts",
    "manage_notifications",
  ],
  MEMBER: [
    // Lecture seule
    "view_dashboard",
    "view_members",
    "view_trains",
    "view_events",
    "view_stats",
  ],
  GUEST: [
    // Accès public aux trains et événements
    "view_trains",
    "view_events",
  ],
};

// Charger les permissions depuis la base de données avec cache
async function getRolePermissionsFromDB(): Promise<
  Record<string, Set<Permission>>
> {
  const now = Date.now();

  // Vérifier si le cache doit être invalidé
  let shouldInvalidate = false;
  try {
    const { shouldInvalidateMiddlewareCache } = await import(
      "@/lib/role-permissions"
    );
    shouldInvalidate = shouldInvalidateMiddlewareCache();
  } catch (error) {
    // Ignorer l'erreur si la fonction n'est pas disponible
  }

  // Utiliser le cache si disponible, pas expiré, et pas d'invalidation forcée
  if (
    rolePermissionsCache &&
    now - permissionsCacheTimestamp < PERMISSIONS_CACHE_DURATION &&
    !shouldInvalidate
  ) {
    return rolePermissionsCache;
  }

  try {
    const prisma = new PrismaClient();

    const allRolePermissions = await prisma.rolePermission.findMany({
      where: {
        isEnabled: true,
      },
      select: {
        roleType: true,
        permission: true,
      },
    });

    await prisma.$disconnect();

    // Organiser par type de rôle
    const permissions: Record<string, Set<Permission>> = {};

    allRolePermissions.forEach(({ roleType, permission }) => {
      if (!permissions[roleType]) {
        permissions[roleType] = new Set();
      }
      permissions[roleType].add(permission as Permission);
    });

    // Ajouter les permissions par défaut si elles n'existent pas
    if (!permissions.ADMIN) {
      permissions.ADMIN = new Set(FALLBACK_ROLE_PERMISSIONS.ADMIN);
    }
    if (!permissions.MEMBER) {
      permissions.MEMBER = new Set(FALLBACK_ROLE_PERMISSIONS.MEMBER);
    }
    if (!permissions.GUEST) {
      permissions.GUEST = new Set(FALLBACK_ROLE_PERMISSIONS.GUEST);
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
      MEMBER: new Set(FALLBACK_ROLE_PERMISSIONS.MEMBER),
      GUEST: new Set(FALLBACK_ROLE_PERMISSIONS.GUEST),
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
    MEMBER: new Set(FALLBACK_ROLE_PERMISSIONS.MEMBER),
    GUEST: new Set(FALLBACK_ROLE_PERMISSIONS.GUEST),
  };
}

// Obtenir les permissions combinées d'un utilisateur
async function getUserCombinedPermissions(
  session: Session | null
): Promise<Set<Permission>> {
  if (!session) return new Set();

  const rolePermissions = await getRolePermissionsFromDB();
  const combinedPermissions = new Set<Permission>();

  // Ajouter les permissions du rôle administratif
  const adminRole = session.user?.role as string;
  if (adminRole && rolePermissions[adminRole]) {
    rolePermissions[adminRole].forEach((p) => combinedPermissions.add(p));
  }

  // Ajouter les permissions du rôle d'alliance si présent
  const allianceRole = (session.user as any)?.allianceRole;
  if (allianceRole && rolePermissions[allianceRole]) {
    rolePermissions[allianceRole].forEach((p) => combinedPermissions.add(p));
  }

  return combinedPermissions;
}

// Version synchrone des permissions combinées
function getUserCombinedPermissionsSync(
  session: Session | null
): Set<Permission> {
  if (!session) return new Set();

  const rolePermissions = getRolePermissionsSync();
  const combinedPermissions = new Set<Permission>();

  // Ajouter les permissions du rôle administratif
  const adminRole = session.user?.role as string;
  if (adminRole && rolePermissions[adminRole]) {
    rolePermissions[adminRole].forEach((p) => combinedPermissions.add(p));
  }

  // Ajouter les permissions du rôle d'alliance si présent
  const allianceRole = (session.user as any)?.allianceRole;
  if (allianceRole && rolePermissions[allianceRole]) {
    rolePermissions[allianceRole].forEach((p) => combinedPermissions.add(p));
  }

  return combinedPermissions;
}

// Déterminer le rôle d'un utilisateur (rôle administratif principal)
export function getUserRole(session: Session | null): UserRole {
  if (!session) return "GUEST";

  // Rôle administratif
  if (session.user?.role === "ADMIN") return "ADMIN";

  // Les autres membres connectés
  return "MEMBER";
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
  const userPermissions = getUserCombinedPermissionsSync(session);
  return userPermissions.has(permission);
}

// Vérifier si un utilisateur a toutes les permissions dans une liste
export function hasAllPermissions(
  session: Session | null,
  permissions: Permission[]
): boolean {
  const userPermissions = getUserCombinedPermissionsSync(session);
  return permissions.every((p) => userPermissions.has(p));
}

// Vérifier si un utilisateur a au moins une des permissions dans une liste
export function hasAnyPermission(
  session: Session | null,
  permissions: Permission[]
): boolean {
  const userPermissions = getUserCombinedPermissionsSync(session);
  return permissions.some((p) => userPermissions.has(p));
}

// Obtenir toutes les permissions d'un utilisateur (version synchrone)
export function getUserPermissions(session: Session | null): Permission[] {
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
