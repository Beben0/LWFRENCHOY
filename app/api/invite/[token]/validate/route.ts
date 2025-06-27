import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.inviteLink.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Lien d'invitation invalide" },
        { status: 404 }
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

    return NextResponse.json({
      valid: true,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      usedCount: invite.usedCount,
    });
  } catch (error) {
    console.error("Erreur lors de la validation de l'invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
