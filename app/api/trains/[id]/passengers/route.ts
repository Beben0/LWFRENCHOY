import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST - Ajouter un passager au train
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trainSlotId } = await params;
    const { passengerId } = await request.json();

    // Vérifier si le train existe
    const trainSlot = await prisma.trainSlot.findUnique({
      where: { id: trainSlotId },
    });

    if (!trainSlot) {
      return NextResponse.json({ error: "Train not found" }, { status: 404 });
    }

    // Calculer l'heure de départ du train (4h après l'heure spécifiée)
    const [hours, minutes] = trainSlot.departureTime.split(":").map(Number);
    const departureDateTime = new Date();
    departureDateTime.setHours(hours + 4, minutes, 0, 0);

    // Vérifier si on est encore dans la période d'inscription (4h avant le départ)
    const now = new Date();
    if (now > departureDateTime) {
      return NextResponse.json(
        { error: "La période d'inscription est terminée" },
        { status: 400 }
      );
    }

    // Ajouter le passager
    const passenger = await prisma.trainPassenger.create({
      data: {
        trainSlotId,
        passengerId,
      },
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
    });

    return NextResponse.json(passenger, { status: 201 });
  } catch (error: any) {
    console.error("Error adding passenger:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ce membre est déjà inscrit à ce train" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un passager du train
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: trainSlotId } = await params;
    const url = new URL(request.url);
    const passengerId = url.searchParams.get("passengerId");

    if (!passengerId) {
      return NextResponse.json(
        { error: "passengerId required" },
        { status: 400 }
      );
    }

    // Vérifier les permissions
    if (session.user.role !== "ADMIN" && session.user.id !== passengerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.trainPassenger.delete({
      where: {
        trainSlotId_passengerId: {
          trainSlotId,
          passengerId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing passenger:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
