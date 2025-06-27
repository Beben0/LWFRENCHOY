import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logTrainAction } from "@/lib/train-history";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const trainSlotSchema = z.object({
  day: z.string(),
  departureTime: z.string(),
  conductorId: z.string().nullable().optional(),
});

const updateTrainSlotSchema = z.object({
  conductorId: z.string().nullable().optional(),
  departureTime: z.string().optional(),
});

// GET - Get train slot by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const trainSlot = await prisma.trainSlot.findUnique({
      where: { id },
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

    if (!trainSlot) {
      return NextResponse.json(
        { error: "Train slot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(trainSlot);
  } catch (error) {
    console.error("Error fetching train slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update train slot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le train slot existe
    const existingSlot = await prisma.trainSlot.findUnique({
      where: { id },
      include: {
        conductor: {
          select: { id: true, pseudo: true },
        },
      },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { error: "Train slot not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateTrainSlotSchema.parse(body);

    // Autoriser l'assignation/désassignation si:
    // - Admin peut tout faire
    // - Membre peut s'assigner/se désassigner
    const isAdmin = session.user.role === "ADMIN";
    const isSelfAssignment = data.conductorId === session.user.id;
    const isRemovingSelf =
      existingSlot.conductorId === session.user.id && data.conductorId === null;

    if (!isAdmin && !isSelfAssignment && !isRemovingSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Récupérer les infos du nouveau conducteur si nécessaire
    let newConductor = null;
    if (data.conductorId) {
      newConductor = await prisma.member.findUnique({
        where: { id: data.conductorId },
        select: { id: true, pseudo: true },
      });
    }

    const updatedSlot = await prisma.trainSlot.update({
      where: { id },
      data: {
        ...(data.conductorId !== undefined && {
          conductorId: data.conductorId,
        }),
        ...(data.departureTime && { departureTime: data.departureTime }),
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

    // Logger les actions dans l'historique
    if (data.conductorId !== undefined) {
      if (data.conductorId === null && existingSlot.conductor) {
        // Conducteur retiré
        await logTrainAction({
          trainSlotId: id,
          action: "CONDUCTOR_REMOVED",
          actorId: session.user.id,
          actorPseudo: session.user.email,
          targetId: existingSlot.conductor.id,
          targetPseudo: existingSlot.conductor.pseudo,
        });
      } else if (data.conductorId && newConductor) {
        // Conducteur assigné
        await logTrainAction({
          trainSlotId: id,
          action: "CONDUCTOR_ASSIGNED",
          actorId: session.user.id,
          actorPseudo: session.user.email,
          targetId: newConductor.id,
          targetPseudo: newConductor.pseudo,
        });
      }
    }

    if (
      data.departureTime &&
      data.departureTime !== existingSlot.departureTime
    ) {
      // Horaire modifié
      await logTrainAction({
        trainSlotId: id,
        action: "TIME_CHANGED",
        actorId: session.user.id,
        actorPseudo: session.user.email,
        details: `${existingSlot.departureTime} → ${data.departureTime}`,
      });
    }

    return NextResponse.json(updatedSlot);
  } catch (error) {
    console.error("Error updating train slot:", error);
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

// DELETE - Delete train slot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.trainSlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting train slot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
