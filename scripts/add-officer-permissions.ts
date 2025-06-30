import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Ajout des permissions pour les rôles R4 et R5...");

  try {
    // Permissions pour R5
    const r5Permissions = [
      "view_dashboard",
      "view_members",
      "view_trains",
      "view_events",
      "view_stats",
      "view_admin_panel",
      "view_help",
      "view_vs",
      "create_event",
      "edit_event",
      "delete_event",
      "create_vs_week",
      "edit_vs_week",
      "delete_vs_week",
      "manage_vs_participants",
      "edit_vs_results",
      "edit_vs",
      "manage_alerts",
      "create_help_article",
      "edit_help_article",
      "delete_help_article",
      "publish_help_article",
    ];

    // Permissions pour R4
    const r4Permissions = [
      "view_dashboard",
      "view_members",
      "view_trains",
      "view_events",
      "view_stats",
      "view_admin_panel",
      "view_help",
      "view_vs",
      "create_event",
      "edit_event",
      "edit_vs_results",
      "manage_alerts",
    ];

    // Créer les permissions pour R5
    for (const permission of r5Permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleType_permission: {
            roleType: "R5",
            permission: permission,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          roleType: "R5",
          permission: permission,
          isEnabled: true,
        },
      });
    }

    console.log(`✅ ${r5Permissions.length} permissions ajoutées pour R5`);

    // Créer les permissions pour R4
    for (const permission of r4Permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleType_permission: {
            roleType: "R4",
            permission: permission,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          roleType: "R4",
          permission: permission,
          isEnabled: true,
        },
      });
    }

    console.log(`✅ ${r4Permissions.length} permissions ajoutées pour R4`);

    console.log("✅ Toutes les permissions ont été ajoutées avec succès!");
  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
