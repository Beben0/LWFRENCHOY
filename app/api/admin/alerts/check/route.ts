import { runAlertChecks } from "@/lib/alert-engine";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

// POST - Déclencher manuellement la vérification des alertes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lancer les vérifications d'alertes
    await runAlertChecks();

    return NextResponse.json({
      message: "Alert checks completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error running alert checks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
