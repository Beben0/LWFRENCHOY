import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function createUser(
  email: string,
  password: string,
  role: "ADMIN" | "GUEST" = "GUEST",
  pseudo?: string
) {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ L'utilisateur ${email} existe déjà`);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        pseudo,
        password: hashedPassword,
        role,
      },
    });

    console.log(`✅ Utilisateur créé avec succès:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Pseudo: ${user.pseudo || "Non défini"}`);
    console.log(`   Rôle: ${user.role}`);
    console.log(`   ID: ${user.id}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
  }
}

async function main() {
  console.log("🔧 Script de création d'utilisateurs\n");

  // Créer l'utilisateur admin par défaut
  await createUser("admin@beben0.com", "admin123", "ADMIN", "Admin");

  // Vous pouvez ajouter d'autres utilisateurs ici
  // await createUser("membre@alliance.gg", "membre123", "GUEST", "TestMember");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
