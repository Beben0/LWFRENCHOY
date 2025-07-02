import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const participantSchema = z.object({
  memberId: z.string(),
  team: z.enum(["TEAM_A", "TEAM_B"]),
  isSubstitute: z.boolean().optional(),
});

const updateParticipantSchema = z.object({
  totalKills: z.number().optional(),
  totalDeaths: z.number().optional(),
  totalDamage: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  powerGain: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  powerLoss: z
    .string()
    .transform((val) => BigInt(val))
    .optional(),
  participation: z.number().min(0).max(100).optional(),
  points: z.number().optional(),
  rewards: z.array(z.string()).optional(),
});

const addParticipantSchema = z.object({
  memberId: z.string().cuid(),
  team: z.enum(["TEAM_A", "TEAM_B"]),
  isSubstitute: z.boolean().optional().default(false),
});

// GET - Liste des participants d'un événement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canView = await hasPermissionAsync(session, "view_desert_storm");

    if (!canView) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const participants = await prisma.desertStormParticipant.findMany({
      where: { eventId: id },
      include: {
        member: true,
        dailyResults: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: [{ points: "desc" }, { totalKills: "desc" }],
    });

    return NextResponse.json(jsonify(participants));
  } catch (error) {
    console.error("Erreur lors de la récupération des participants:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter un participant à un événement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canEdit = await hasPermissionAsync(
      session,
      "manage_desert_storm_participants"
    );

    if (!canEdit) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const data = addParticipantSchema.parse(body);

    const existing = await prisma.desertStormParticipant.findUnique({
      where: {
        eventId_memberId: {
          eventId,
          memberId: data.memberId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Participant déjà inscrit" },
        { status: 400 }
      );
    }

    const participant = await prisma.desertStormParticipant.create({
      data: {
        eventId,
        memberId: data.memberId,
        team: data.team,
        isSubstitute: data.isSubstitute,
      },
      include: { member: true },
    });

    return NextResponse.json(jsonify(participant), { status: 201 });
  } catch (error) {
    console.error("Erreur ajout participant DS:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour les résultats d'un participant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canEdit = await hasPermissionAsync(
      session,
      "edit_desert_storm_results"
    );

    if (!canEdit) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { participantId, ...updateData } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "ID du participant requis" },
        { status: 400 }
      );
    }

    const validatedData = updateParticipantSchema.parse(updateData);

    const participant = await prisma.$transaction(async (tx) => {
      // Mettre à jour le participant
      const updated = await tx.desertStormParticipant.update({
        where: {
          id: participantId,
          eventId, // Sécurité : s'assurer que le participant appartient à cet événement
        },
        data: validatedData,
        include: {
          member: true,
        },
      });

      // Recalculer les scores des équipes A et B basés sur la somme des points participants
      const allParticipants = await tx.desertStormParticipant.findMany({
        where: { eventId },
        select: {
          team: true,
          points: true,
        },
      });

      const teamAScore = allParticipants
        .filter((p) => p.team === "TEAM_A")
        .reduce((sum, p) => sum + (p.points || 0), 0);
      const teamBScore = allParticipants
        .filter((p) => p.team === "TEAM_B")
        .reduce((sum, p) => sum + (p.points || 0), 0);

      let result: "TEAM_A_VICTORY" | "TEAM_B_VICTORY" | "DRAW" | null = null;
      if (teamAScore > teamBScore) result = "TEAM_A_VICTORY";
      else if (teamBScore > teamAScore) result = "TEAM_B_VICTORY";
      else result = "DRAW";

      await tx.desertStormEvent.update({
        where: { id: eventId },
        data: {
          teamAScore,
          teamBScore,
          result,
        },
      });

      return updated;
    });

    return NextResponse.json(jsonify(participant));
  } catch (error) {
    console.error("Erreur lors de la mise à jour du participant:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Retirer un participant d'un événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canManage = await hasPermissionAsync(
      session,
      "manage_desert_storm_participants"
    );

    if (!canManage) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json(
        { error: "ID du participant requis" },
        { status: 400 }
      );
    }

    await prisma.desertStormParticipant.delete({
      where: {
        id: participantId,
        eventId, // Sécurité : s'assurer que le participant appartient à cet événement
      },
    });

    return NextResponse.json({ message: "Participant retiré avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du participant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
