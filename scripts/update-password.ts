import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function updatePassword(email: string, newPassword: string) {
  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé`);
      return;
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    console.log(`✅ Mot de passe mis à jour pour ${email}`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du mot de passe:", error);
  }
}

async function main() {
  console.log("🔧 Script de mise à jour des mots de passe\n");

  // Mettre à jour les mots de passe pour tous les utilisateurs
  await updatePassword("admin@alliance.gg", "admin123");
  await updatePassword("henri.benjamin03@gmail.com", "admin123"); // Mot de passe temporaire

  console.log(
    "\n🔐 Tous les mots de passe ont été mis à jour avec hachage bcrypt"
  );
  console.log("📧 Connexions disponibles:");
  console.log("   admin@alliance.gg / admin123");
  console.log("   henri.benjamin03@gmail.com / admin123");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
