import {
  alertScheduler,
  getAlertSchedulerStatus,
  startAlertScheduler,
  stopAlertScheduler,
} from "@/lib/alert-scheduler";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

// GET - Obtenir le statut du scheduler
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getAlertSchedulerStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting scheduler status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Contrôler le scheduler (start/stop/configure)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, intervalMinutes } = body;

    switch (action) {
      case "start":
        startAlertScheduler(intervalMinutes);
        return NextResponse.json({
          message: "Alert scheduler started",
          status: getAlertSchedulerStatus(),
        });

      case "stop":
        stopAlertScheduler();
        return NextResponse.json({
          message: "Alert scheduler stopped",
          status: getAlertSchedulerStatus(),
        });

      case "restart":
        stopAlertScheduler();
        startAlertScheduler(intervalMinutes);
        return NextResponse.json({
          message: "Alert scheduler restarted",
          status: getAlertSchedulerStatus(),
        });

      case "configure":
        if (intervalMinutes && intervalMinutes > 0) {
          alertScheduler.setInterval(intervalMinutes);
          return NextResponse.json({
            message: `Interval updated to ${intervalMinutes} minutes`,
            status: getAlertSchedulerStatus(),
          });
        }
        return NextResponse.json(
          { error: "Invalid interval" },
          { status: 400 }
        );

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error controlling scheduler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
