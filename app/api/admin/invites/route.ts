import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createInviteSchema = z.object({
  maxUses: z.number().min(1).optional(),
  expiresInHours: z.number().min(1).max(8760).optional(), // max 1 an
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const invites = await prisma.inviteLink.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Erreur lors de la récupération des invitations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = createInviteSchema.parse(data);

    // Générer un token unique
    const token = randomBytes(32).toString("hex");

    // Calculer la date d'expiration si fournie
    const expiresAt = validatedData.expiresInHours
      ? new Date(Date.now() + validatedData.expiresInHours * 60 * 60 * 1000)
      : null;

    const invite = await prisma.inviteLink.create({
      data: {
        token,
        createdBy: session.user.id,
        maxUses: validatedData.maxUses,
        expiresAt,
      },
    });

    return NextResponse.json(invite);
  } catch (error) {
    console.error("Erreur lors de la création de l'invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
