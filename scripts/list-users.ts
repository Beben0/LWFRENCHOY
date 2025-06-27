import { prisma } from "../lib/prisma";

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("👥 Utilisateurs dans la base de données:\n");

    if (users.length === 0) {
      console.log("Aucun utilisateur trouvé.");
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Rôle: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Créé le: ${user.createdAt.toLocaleString("fr-FR")}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
  }
}

async function main() {
  await listUsers();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
