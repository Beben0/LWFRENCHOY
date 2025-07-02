import { auth } from "@/lib/auth";
import { Permission } from "@/lib/permissions";
import {
  getAllianceRoles,
  getAllRolePermissions,
  initializeDefaultPermissions,
  invalidateMiddlewareCache,
  saveAllRolePermissions,
} from "@/lib/role-permissions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const permissionsSchema = z.object({
  rolePermissions: z.record(z.array(z.string())),
});

// GET - Récupérer toutes les configurations de rôles et permissions
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les rôles d'alliance depuis le référentiel
    const allianceRoles = await getAllianceRoles();

    // Récupérer toutes les permissions
    const rolePermissions = await getAllRolePermissions();

    // Lister toutes les permissions disponibles
    const allPermissions: Permission[] = [
      "view_dashboard",
      "view_members",
      "view_trains",
      "view_events",
      "view_stats",
      "view_admin_panel",
      "view_vs",
      "view_desert_storm",
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
      "edit_vs",
      "create_desert_storm",
      "edit_desert_storm",
      "delete_desert_storm",
      "manage_desert_storm_participants",
      "edit_desert_storm_results",
      "manage_users",
      "manage_permissions",
      "export_data",
      "import_data",
      "manage_alerts",
      "manage_notifications",
      "view_help",
      "create_help_article",
      "edit_help_article",
      "delete_help_article",
      "publish_help_article",
      "manage_help_categories",
    ];

    // Invalider cache permissions middleware
    invalidateMiddlewareCache();

    return NextResponse.json({
      rolePermissions,
      allianceRoles,
      availablePermissions: allPermissions,
      adminRoles: ["ADMIN", "GUEST"],
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Sauvegarder les configurations de rôles et permissions
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { rolePermissions } = permissionsSchema.parse(body);

    // Convertir les permissions string en Permission[]
    const typedRolePermissions: Record<string, Permission[]> = {};
    for (const [role, permissions] of Object.entries(rolePermissions)) {
      typedRolePermissions[role] = permissions as Permission[];
    }

    const success = await saveAllRolePermissions(typedRolePermissions);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    // Invalider cache permissions middleware
    invalidateMiddlewareCache();

    return NextResponse.json({
      message: "Permissions sauvegardées avec succès",
      rolePermissions: typedRolePermissions,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des rôles:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Initialiser les permissions par défaut
export async function PUT() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await initializeDefaultPermissions();

    // Invalider cache permissions middleware
    invalidateMiddlewareCache();

    return NextResponse.json({
      message: "Permissions par défaut initialisées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
