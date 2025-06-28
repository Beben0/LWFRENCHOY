import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  getTrainSchedulerStatus,
  runTrainMaintenanceNow,
  runTrainStatusUpdateNow,
  startTrainScheduler,
  stopTrainScheduler,
} from "@/lib/train-scheduler";
import { NextRequest, NextResponse } from "next/server";

// GET - Obtenir le statut du scheduler
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "edit_train_slot")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const status = getTrainSchedulerStatus();

    return NextResponse.json({
      success: true,
      scheduler: status,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        autoStartTrains: process.env.AUTO_START_TRAINS,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Contrôler le scheduler (start/stop/maintenance)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "edit_train_slot")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, statusCheckHours, maintenanceHour } = body;

    switch (action) {
      case "start":
        startTrainScheduler(statusCheckHours, maintenanceHour);
        return NextResponse.json({
          success: true,
          message: "Train scheduler démarré",
          status: getTrainSchedulerStatus(),
        });

      case "stop":
        stopTrainScheduler();
        return NextResponse.json({
          success: true,
          message: "Train scheduler arrêté",
          status: getTrainSchedulerStatus(),
        });

      case "maintenance_now":
        console.log(
          `🔧 Admin ${session.user.email} triggered manual train maintenance`
        );

        // Exécuter en arrière-plan pour ne pas bloquer la réponse
        runTrainMaintenanceNow().catch((error) => {
          console.error("Error during manual maintenance:", error);
        });

        return NextResponse.json({
          success: true,
          message: "Maintenance des trains déclenchée",
          info: "La maintenance s'exécute en arrière-plan. Consultez les logs pour suivre la progression.",
        });

      case "status_update_now":
        console.log(
          `🔄 Admin ${session.user.email} triggered manual status update`
        );

        // Exécuter en arrière-plan
        runTrainStatusUpdateNow().catch((error) => {
          console.error("Error during manual status update:", error);
        });

        return NextResponse.json({
          success: true,
          message: "Mise à jour des statuts déclenchée",
          info: "La mise à jour s'exécute en arrière-plan.",
        });

      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur lors du contrôle du scheduler:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
