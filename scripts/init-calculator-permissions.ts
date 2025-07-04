import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧮 Initialisation des permissions du calculateur...");

  try {
    // Permissions pour ADMIN
    const adminPermissions = [
      "view_calculator",
      "use_calculator",
      "manage_calculator_presets",
      "export_calculator_results",
    ];

    for (const permission of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleType_permission: {
            roleType: "ADMIN",
            permission: permission,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          roleType: "ADMIN",
          permission: permission,
          isEnabled: true,
        },
      });
    }

    console.log(
      `✅ ${adminPermissions.length} permissions ajoutées pour ADMIN`
    );

    // Permissions pour GUEST
    const guestPermissions = ["view_calculator", "use_calculator"];

    for (const permission of guestPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleType_permission: {
            roleType: "GUEST",
            permission: permission,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          roleType: "GUEST",
          permission: permission,
          isEnabled: true,
        },
      });
    }

    console.log(
      `✅ ${guestPermissions.length} permissions ajoutées pour GUEST`
    );

    // Permissions pour R5
    const r5Permissions = [
      "view_calculator",
      "use_calculator",
      "manage_calculator_presets",
      "export_calculator_results",
    ];

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

    // Permissions pour R4
    const r4Permissions = [
      "view_calculator",
      "use_calculator",
      "manage_calculator_presets",
    ];

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

    // Permissions pour MEMBER
    const memberPermissions = ["view_calculator", "use_calculator"];

    for (const permission of memberPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleType_permission: {
            roleType: "MEMBER",
            permission: permission,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          roleType: "MEMBER",
          permission: permission,
          isEnabled: true,
        },
      });
    }

    console.log(
      `✅ ${memberPermissions.length} permissions ajoutées pour MEMBER`
    );

    console.log(
      "🎉 Toutes les permissions du calculateur ont été initialisées avec succès !"
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des permissions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
