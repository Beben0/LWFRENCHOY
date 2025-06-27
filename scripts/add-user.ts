import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Script pour ajouter un nouvel utilisateur
// Usage: npx tsx scripts/add-user.ts email@example.com motdepasse [ADMIN|MEMBER]

async function addUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      "❌ Usage: npx tsx scripts/add-user.ts <email> <password> [ADMIN|MEMBER]"
    );
    console.log(
      "📧 Exemple: npx tsx scripts/add-user.ts user@alliance.gg password123 ADMIN"
    );
    process.exit(1);
  }

  const [email, password, roleArg] = args;
  const role = roleArg === "ADMIN" || roleArg === "MEMBER" ? roleArg : "MEMBER";

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`❌ L'utilisateur ${email} existe déjà`);
      console.log(`   Rôle actuel: ${existingUser.role}`);
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Format d'email invalide");
      return;
    }

    // Validation du mot de passe
    if (password.length < 6) {
      console.log("❌ Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as "ADMIN" | "MEMBER",
      },
    });

    console.log(`✅ Utilisateur créé avec succès:`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Rôle: ${user.role}`);
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   📅 Créé le: ${user.createdAt.toLocaleString("fr-FR")}`);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
  }
}

async function main() {
  console.log("👥 Script d'ajout d'utilisateur\n");
  await addUser();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
