import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  pseudo: z.string().min(2).max(50),
  password: z.string().min(6),
  inviteToken: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const validatedData = registerSchema.parse(data);

    // Vérifier le lien d'invitation
    const invite = await prisma.inviteLink.findUnique({
      where: { token: validatedData.inviteToken },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Lien d'invitation invalide" },
        { status: 400 }
      );
    }

    if (!invite.isActive) {
      return NextResponse.json(
        { error: "Lien d'invitation désactivé" },
        { status: 400 }
      );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Lien d'invitation expiré" },
        { status: 400 }
      );
    }

    if (invite.maxUses && invite.usedCount >= invite.maxUses) {
      return NextResponse.json(
        { error: "Lien d'invitation épuisé" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Vérifier si l'email a déjà utilisé ce lien
    if (invite.usedBy.includes(validatedData.email)) {
      return NextResponse.json(
        { error: "Vous avez déjà utilisé ce lien d'invitation" },
        { status: 400 }
      );
    }

    // Crypter le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        pseudo: validatedData.pseudo,
        password: hashedPassword,
        role: "GUEST",
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        createdAt: true,
      },
    });

    // Mettre à jour le lien d'invitation
    await prisma.inviteLink.update({
      where: { token: validatedData.inviteToken },
      data: {
        usedCount: { increment: 1 },
        usedBy: { push: validatedData.email },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
