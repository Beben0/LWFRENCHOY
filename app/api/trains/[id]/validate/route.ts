import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logTrainAction } from "@/lib/train-history";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!hasPermission(session, "view_admin_panel")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { isValidated } = await request.json();
    const { id: trainId } = await params;

    // Récupérer le train actuel
    const currentTrain = await prisma.trainSlot.findUnique({
      where: { id: trainId },
      include: { conductor: true },
    });

    if (!currentTrain) {
      return new NextResponse("Train not found", { status: 404 });
    }

    // Pour l'instant, on va simplement enregistrer l'action dans l'historique
    // Les champs isValidated, validatedBy, validatedAt seront ajoutés plus tard
    const updatedTrain = currentTrain;

    // Enregistrer l'action dans l'historique
    await logTrainAction({
      trainSlotId: trainId,
      action: isValidated ? "TRAIN_VALIDATED" : "TRAIN_UNVALIDATED",
      actorId: session?.user?.id,
      actorPseudo: session?.user?.email?.split("@")[0] || "Admin",
      details: `Train ${isValidated ? "validé" : "invalidé"} - ${
        currentTrain.day
      } ${currentTrain.departureTime}`,
    });

    return NextResponse.json({
      success: true,
      train: updatedTrain,
    });
  } catch (error) {
    console.error("Error validating train:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
