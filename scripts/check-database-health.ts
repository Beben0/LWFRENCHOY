import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏥 Database Health Check");
  console.log("========================\n");

  try {
    // 1. Vérifier les utilisateurs
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    console.log(`👥 Users: ${userCount} total (${adminCount} admins)`);

    // 2. Vérifier les membres
    const memberCount = await prisma.member.count();
    const memberSpecialties = await prisma.member.groupBy({
      by: ["specialty"],
      _count: { id: true },
    });
    console.log(`🎯 Members: ${memberCount} total`);
    memberSpecialties.forEach((s) =>
      console.log(`   - ${s.specialty}: ${s._count.id}`)
    );

    // 3. Vérifier les données de référence
    const refDataCount = await prisma.referenceData.count();
    const refByCategory = await prisma.referenceData.groupBy({
      by: ["category"],
      _count: { id: true },
    });
    console.log(`\n📚 Reference Data: ${refDataCount} total`);
    refByCategory.forEach((r) =>
      console.log(`   - ${r.category}: ${r._count.id}`)
    );

    // 4. Vérifier les permissions
    const permissionCount = await prisma.rolePermission.count();
    const permsByRole = await prisma.rolePermission.groupBy({
      by: ["roleType"],
      _count: { id: true },
    });
    console.log(`\n🔐 Permissions: ${permissionCount} total`);
    permsByRole.forEach((p) =>
      console.log(`   - ${p.roleType}: ${p._count.id}`)
    );

    // 5. Vérifier les trains
    const trainSlotCount = await prisma.trainSlot.count();
    console.log(`\n🚂 Train Slots: ${trainSlotCount}`);

    // 6. Vérifier les événements
    const eventCount = await prisma.event.count();
    console.log(`📅 Events: ${eventCount}`);

    // 7. Vérifier les stats
    const statsCount = await prisma.allianceStats.count();
    console.log(`📊 Alliance Stats: ${statsCount}`);

    console.log("\n✅ Database appears healthy!");
  } catch (error) {
    console.error("❌ Database health check failed:", error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
