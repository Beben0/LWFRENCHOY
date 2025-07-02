import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.rolePermission.findMany({
    select: { roleType: true, permission: true, isEnabled: true },
    orderBy: [{ roleType: "asc" }, { permission: "asc" }],
  });
  console.table(rows);
  await prisma.$disconnect();
})();
