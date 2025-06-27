import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Checking reference data...");

  const summary = await prisma.referenceData.groupBy({
    by: ["category"],
    _count: {
      id: true,
    },
    orderBy: {
      category: "asc",
    },
  });

  console.log("\n📋 Reference Data Summary:");
  console.log("========================");
  for (const item of summary) {
    console.log(`${item.category}: ${item._count.id} items`);
  }

  console.log("\n🎯 Detailed breakdown:");
  console.log("======================");

  for (const item of summary) {
    const items = await prisma.referenceData.findMany({
      where: { category: item.category },
      select: { key: true, label: true, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    console.log(`\n${item.category}:`);
    items.forEach((ref) => {
      const status = ref.isActive ? "✅" : "❌";
      console.log(`  ${status} ${ref.key} - ${ref.label}`);
    });
  }

  const totalCount = await prisma.referenceData.count();
  console.log(`\n📈 Total: ${totalCount} reference items`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
