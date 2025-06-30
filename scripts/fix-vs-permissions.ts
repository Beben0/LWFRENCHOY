import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const vsPermissions = [
  "view_vs",
  "create_vs_week",
  "edit_vs_week",
  "delete_vs_week",
  "manage_vs_participants",
  "edit_vs_results",
  "edit_vs",
];

async function main() {
  for (const permission of vsPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleType_permission: { roleType: "ADMIN", permission } },
      update: { isEnabled: true },
      create: { roleType: "ADMIN", permission, isEnabled: true },
    });
  }
  console.log("✅ Permissions VS ajoutées pour ADMIN");
  await prisma.$disconnect();
}

main();
