import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const trainSlotSchema = z.object({
  day: z.string(),
  departureTime: z.string(),
  conductorId: z.string().nullable().optional(),
});

// GET - List train slots avec rétrocompatibilité
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const canView = await hasPermissionAsync(session, "view_trains");
    if (!canView) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Utiliser le nouveau schéma
    const trainSlots = await prisma.trainSlot.findMany({
      include: {
        conductor: {
          select: {
            id: true,
            pseudo: true,
            level: true,
            specialty: true,
            allianceRole: true,
          },
        },
        passengers: {
          include: {
            passenger: {
              select: {
                id: true,
                pseudo: true,
                level: true,
                specialty: true,
                allianceRole: true,
              },
            },
          },
        },
      },
      orderBy: { day: "asc" },
    });

    return NextResponse.json(trainSlots);
  } catch (error) {
    console.error("Error fetching train slots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new train slot
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const canCreate = await hasPermissionAsync(session, "create_train_slot");
    if (!canCreate) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = trainSlotSchema.parse(body);

    // Créer avec le nouveau schéma
    const trainSlot = await prisma.trainSlot.create({
      data: {
        day: data.day,
        departureTime: data.departureTime,
        conductorId: data.conductorId,
      },
      include: {
        conductor: {
          select: {
            id: true,
            pseudo: true,
            level: true,
            specialty: true,
            allianceRole: true,
          },
        },
        passengers: {
          include: {
            passenger: {
              select: {
                id: true,
                pseudo: true,
                level: true,
                specialty: true,
                allianceRole: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(trainSlot, { status: 201 });
  } catch (error) {
    console.error("Error creating train slot:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
