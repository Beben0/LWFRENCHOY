import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const desertStormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  teamAName: z.string().default("Équipe A"),
  teamBName: z.string().default("Équipe B"),
  teamAScore: z.number().default(0),
  teamBScore: z.number().default(0),
  enemyTeamAAllianceName: z.string().optional(),
  enemyTeamBAllianceName: z.string().optional(),
  enemyTeamAScore: z.number().default(0),
  enemyTeamBScore: z.number().default(0),
  status: z
    .enum(["PREPARATION", "ACTIVE", "COMPLETED", "CANCELLED"])
    .default("PREPARATION"),
});

// GET - Liste des événements Desert Storm
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const canView = await hasPermissionAsync(session, "view_desert_storm");

    if (!canView) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const events = await prisma.desertStormEvent.findMany({
      include: {
        participants: {
          include: {
            member: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json(jsonify(events));
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des événements Desert Storm:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un nouvel événement Desert Storm
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const canCreate = await hasPermissionAsync(session, "create_desert_storm");

    if (!canCreate) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = desertStormSchema.parse(body);

    const event = await prisma.desertStormEvent.create({
      data: validatedData,
      include: {
        participants: {
          include: {
            member: true,
          },
        },
      },
    });

    return NextResponse.json(jsonify(event), { status: 201 });
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'événement Desert Storm:",
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
