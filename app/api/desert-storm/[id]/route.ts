import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateDesertStormSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  teamAName: z.string().optional(),
  teamBName: z.string().optional(),
  teamAScore: z.number().optional(),
  teamBScore: z.number().optional(),
  enemyTeamAAllianceName: z.string().optional(),
  enemyTeamBAllianceName: z.string().optional(),
  enemyTeamAScore: z.number().optional(),
  enemyTeamBScore: z.number().optional(),
  status: z
    .enum(["PREPARATION", "ACTIVE", "COMPLETED", "CANCELLED"])
    .optional(),
  result: z.enum(["TEAM_A_VICTORY", "TEAM_B_VICTORY", "DRAW"]).optional(),
});

// GET - Récupérer un événement Desert Storm spécifique
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

    const event = await prisma.desertStormEvent.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            member: true,
            dailyResults: {
              orderBy: { date: "asc" },
            },
          },
          orderBy: [{ points: "desc" }, { totalKills: "desc" }],
        },
        dailyResults: {
          where: { participantId: null }, // Résultats globaux seulement
          orderBy: { date: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(jsonify(event));
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'événement Desert Storm:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour un événement Desert Storm
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canEdit = await hasPermissionAsync(session, "edit_desert_storm");

    if (!canEdit) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateDesertStormSchema.parse(body);

    // Fetch current scores to compute result if needed
    const current = await prisma.desertStormEvent.findUnique({ where: { id } });

    let computedResult = validatedData.result;
    if (
      validatedData.teamAScore !== undefined ||
      validatedData.teamBScore !== undefined
    ) {
      const teamAScore = validatedData.teamAScore ?? current?.teamAScore ?? 0;
      const teamBScore = validatedData.teamBScore ?? current?.teamBScore ?? 0;

      if (teamAScore > teamBScore) computedResult = "TEAM_A_VICTORY";
      else if (teamBScore > teamAScore) computedResult = "TEAM_B_VICTORY";
      else computedResult = "DRAW";
    }

    let computedStatus = validatedData.status;
    if (computedStatus === undefined) {
      const start = validatedData.startDate ?? current?.startDate;
      const end = validatedData.endDate ?? current?.endDate;
      const now = new Date();
      if (start && now < start) {
        computedStatus = "PREPARATION";
      } else if (end && now > end) {
        computedStatus = "COMPLETED";
      } else {
        computedStatus = "ACTIVE";
      }
    }

    const event = await prisma.desertStormEvent.update({
      where: { id },
      data: {
        ...validatedData,
        result: computedResult,
        status: computedStatus,
      },
      include: {
        participants: {
          include: {
            member: true,
          },
        },
      },
    });

    return NextResponse.json(jsonify(event));
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'événement Desert Storm:",
      error
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un événement Desert Storm
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canDelete = await hasPermissionAsync(session, "delete_desert_storm");

    if (!canDelete) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.desertStormEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Événement Desert Storm supprimé avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'événement Desert Storm:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
