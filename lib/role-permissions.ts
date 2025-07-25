import { prisma } from "@/lib/prisma";
import { Permission } from "./permissions";

export type UserRoleType = "ADMIN" | "GUEST" | string; // string pour les rôles d'alliance

// Configuration par défaut des rôles administratifs
const DEFAULT_ADMIN_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
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
    "create_vs_week",
    "edit_vs_week",
    "delete_vs_week",
    "manage_vs_participants",
    "edit_vs_results",
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
    "view_trains",
    "view_events",
    "view_help",
    "view_vs",
    "view_desert_storm",
    "view_calculator",
    "use_calculator",
  ],
};

// Permissions par défaut pour les rôles d'alliance
const DEFAULT_ALLIANCE_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  R5: [
    "view_dashboard",
    "view_members",
    "view_trains",
    "view_events",
    "view_stats",
    "view_vs",
    "view_desert_storm",
    "view_calculator",
    "create_member",
    "edit_member",
    "create_train_slot",
    "edit_train_slot",
    "create_event",
    "edit_event",
    "create_vs_week",
    "edit_vs_week",
    "manage_vs_participants",
    "edit_vs_results",
    "create_desert_storm",
    "edit_desert_storm",
    "manage_desert_storm_participants",
    "edit_desert_storm_results",
    "use_calculator",
    "manage_calculator_presets",
    "export_calculator_results",
    "manage_alerts",
  ],
  R4: [
    "view_dashboard",
    "view_members",
    "view_trains",
    "view_events",
    "view_stats",
    "view_vs",
    "view_desert_storm",
    "view_calculator",
    "create_train_slot",
    "edit_train_slot",
    "edit_vs_results",
    "edit_desert_storm_results",
    "use_calculator",
    "manage_calculator_presets",
  ],
  MEMBER: [
    "view_dashboard",
    "view_members",
    "view_trains",
    "view_events",
    "view_stats",
    "view_vs",
    "view_desert_storm",
    "view_calculator",
    "use_calculator",
  ],
};

// Récupérer tous les rôles d'alliance depuis le référentiel
export async function getAllianceRoles(): Promise<string[]> {
  try {
    // Rôles depuis referenceData (actifs et inactifs)
    const allRefRoles = await prisma.referenceData.findMany({
      where: { category: "ALLIANCE_ROLE" },
      select: { key: true, isActive: true },
    });

    const activeRoles = allRefRoles.filter((r) => r.isActive).map((r) => r.key);

    const inactiveRolesSet = new Set(
      allRefRoles.filter((r) => !r.isActive).map((r) => r.key)
    );

    // Rôles détectés dans rolePermission (ex: créés mais pas encore dans referenceData)
    const rolesFromPermissionsRaw = await prisma.rolePermission.findMany({
      where: {
        NOT: {
          roleType: { in: ["ADMIN", "GUEST"] },
        },
      },
      distinct: ["roleType"],
      select: { roleType: true },
    });

    const rolesFromPermissions = rolesFromPermissionsRaw
      .map((r) => r.roleType)
      .filter((role) => !inactiveRolesSet.has(role)); // Exclure si marqué inactif

    const combined = Array.from(
      new Set([...activeRoles, ...rolesFromPermissions])
    );

    return combined.length > 0 ? combined : ["R5", "R4", "MEMBER"];
  } catch (error) {
    console.error("Error fetching alliance roles:", error);
    return ["R5", "R4", "MEMBER"]; // Fallback
  }
}

// Récupérer les permissions d'un utilisateur (combinaison rôle admin + rôle alliance)
export async function getUserPermissions(
  adminRole: "ADMIN" | "GUEST",
  allianceRole?: string | null
): Promise<Permission[]> {
  try {
    const permissions = new Set<Permission>();

    // Ajouter les permissions du rôle administratif
    const adminPermissions = await getRoleTypePermissions(adminRole);
    adminPermissions.forEach((p) => permissions.add(p));

    // Ajouter les permissions du rôle d'alliance si présent
    if (allianceRole) {
      const alliancePermissions = await getRoleTypePermissions(allianceRole);
      alliancePermissions.forEach((p) => permissions.add(p));
    }

    return Array.from(permissions);
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return DEFAULT_ADMIN_PERMISSIONS.GUEST;
  }
}

// Récupérer les permissions d'un type de rôle spécifique
export async function getRoleTypePermissions(
  roleType: string
): Promise<Permission[]> {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleType,
        isEnabled: true,
      },
      select: { permission: true },
    });

    if (rolePermissions.length === 0) {
      // Si aucune permission en BDD, retourner les permissions par défaut
      if (roleType === "ADMIN" || roleType === "GUEST") {
        return DEFAULT_ADMIN_PERMISSIONS[roleType] || [];
      }

      // Pour les rôles d'alliance, utiliser les permissions par défaut si disponibles
      return DEFAULT_ALLIANCE_ROLE_PERMISSIONS[roleType] || [];
    }

    return rolePermissions.map((rp) => rp.permission as Permission);
  } catch (error) {
    console.error(
      `Error fetching permissions for role type ${roleType}:`,
      error
    );

    // En cas d'erreur, retourner les permissions par défaut
    if (roleType === "ADMIN" || roleType === "GUEST") {
      return DEFAULT_ADMIN_PERMISSIONS[roleType] || [];
    }

    return DEFAULT_ALLIANCE_ROLE_PERMISSIONS[roleType] || [];
  }
}

// Récupérer toutes les configurations de rôles
export async function getAllRolePermissions() {
  try {
    const allPermissions = await prisma.rolePermission.findMany({
      orderBy: [{ roleType: "asc" }, { permission: "asc" }],
    });

    // Récupérer tous les rôles d'alliance
    const allianceRoles = await getAllianceRoles();

    // Créer la structure de données
    const rolePermissions: Record<string, Permission[]> = {
      ADMIN: [],
      GUEST: [],
    };

    // Ajouter les rôles d'alliance
    allianceRoles.forEach((role) => {
      rolePermissions[role] = [];
    });

    // Remplir avec les permissions de la BDD
    allPermissions.forEach((rp) => {
      if (rp.isEnabled && rolePermissions[rp.roleType] !== undefined) {
        rolePermissions[rp.roleType].push(rp.permission as Permission);
      }
    });

    // Si aucune permission pour un rôle administratif, utiliser les permissions par défaut
    if (rolePermissions.ADMIN.length === 0) {
      rolePermissions.ADMIN = DEFAULT_ADMIN_PERMISSIONS.ADMIN;
    }
    if (rolePermissions.GUEST.length === 0) {
      rolePermissions.GUEST = DEFAULT_ADMIN_PERMISSIONS.GUEST;
    }

    // Pour les rôles d'alliance sans permissions, utiliser les permissions par défaut
    allianceRoles.forEach((role) => {
      if (rolePermissions[role].length === 0) {
        rolePermissions[role] = DEFAULT_ALLIANCE_ROLE_PERMISSIONS[role] || [];
      }
    });

    return rolePermissions;
  } catch (error) {
    console.error("Error fetching all role permissions:", error);
    return {
      ...DEFAULT_ADMIN_PERMISSIONS,
      ...DEFAULT_ALLIANCE_ROLE_PERMISSIONS,
    };
  }
}

// Sauvegarder les permissions d'un type de rôle
export async function saveRoleTypePermissions(
  roleType: string,
  permissions: Permission[]
) {
  try {
    // Commencer une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer toutes les permissions existantes pour ce type de rôle
      await tx.rolePermission.deleteMany({
        where: { roleType },
      });

      // Ajouter les nouvelles permissions
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleType,
            permission,
            isEnabled: true,
          })),
        });
      }
    });

    return true;
  } catch (error) {
    console.error(`Error saving permissions for role type ${roleType}:`, error);
    return false;
  }
}

// Sauvegarder toutes les configurations de rôles
export async function saveAllRolePermissions(
  rolePermissions: Record<string, Permission[]>
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Supprimer toutes les permissions existantes
      await tx.rolePermission.deleteMany();

      // Ajouter toutes les nouvelles permissions
      const permissionsData = [];
      for (const [roleType, permissions] of Object.entries(rolePermissions)) {
        for (const permission of permissions) {
          permissionsData.push({
            roleType,
            permission,
            isEnabled: true,
          });
        }
      }

      if (permissionsData.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionsData,
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Error saving all role permissions:", error);
    return false;
  }
}

// Initialiser les permissions par défaut en base de données
export async function initializeDefaultPermissions() {
  try {
    const existingPermissions = await prisma.rolePermission.count();

    if (existingPermissions === 0) {
      console.log("Initializing default role permissions...");

      // Récupérer les rôles d'alliance et combiner avec les rôles admin
      const allianceRoles = await getAllianceRoles();
      const allPermissions = {
        ...DEFAULT_ADMIN_PERMISSIONS,
      };

      // Ajouter les permissions par défaut pour chaque rôle d'alliance
      allianceRoles.forEach((role) => {
        allPermissions[role] = DEFAULT_ALLIANCE_ROLE_PERMISSIONS[role] || [];
      });

      await saveAllRolePermissions(allPermissions);
      console.log("Default role permissions initialized successfully.");
    }
  } catch (error) {
    console.error("Error initializing default permissions:", error);
  }
}

// Réinitialiser aux permissions par défaut
export async function resetToDefaultPermissions() {
  const allianceRoles = await getAllianceRoles();
  const allPermissions = {
    ...DEFAULT_ADMIN_PERMISSIONS,
  };

  allianceRoles.forEach((role) => {
    allPermissions[role] = DEFAULT_ALLIANCE_ROLE_PERMISSIONS[role] || [];
  });

  return await saveAllRolePermissions(allPermissions);
}

// Cache invalidation pour le middleware
let middlewareCacheInvalidated = false;

export function invalidateMiddlewareCache() {
  middlewareCacheInvalidated = true;
  // Reset le flag après un court délai pour permettre au middleware de détecter le changement
  setTimeout(() => {
    middlewareCacheInvalidated = false;
  }, 1000);
}

export function shouldInvalidateMiddlewareCache(): boolean {
  return middlewareCacheInvalidated;
}
