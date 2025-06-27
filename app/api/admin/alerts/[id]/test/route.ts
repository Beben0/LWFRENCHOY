import { AlertEngine } from "@/lib/alert-engine";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST - Tester une règle spécifique et prévisualiser le message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ruleId } = await params;
    const body = await request.json().catch(() => ({}));
    const { sendNotifications = false } = body;

    // Récupérer la règle
    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Initialiser l'engine d'alertes
    const engine = new AlertEngine();
    await engine.initialize();

    // Évaluer la règle
    const result = await engine.testRule(rule);

    // Si demandé et que l'alerte se déclenche, envoyer les vraies notifications
    let notificationsSent = false;
    if (sendNotifications && result.triggered) {
      try {
        await engine.sendTestNotifications(rule, result);
        notificationsSent = true;
      } catch (error) {
        console.error("Error sending test notifications:", error);
      }
    }

    return NextResponse.json({
      success: true,
      rule: {
        id: rule.id,
        name: rule.name,
        type: rule.type,
        severity: rule.severity,
        channels: rule.channels,
      },
      result: {
        triggered: result.triggered,
        message: result.message,
        data: result.data,
        variables: result.variables,
      },
      previews: await generateChannelPreviews(rule, result),
      notificationsSent,
      sentNotifications: sendNotifications,
    });
  } catch (error) {
    console.error("Error testing alert rule:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function generateChannelPreviews(rule: any, result: any) {
  const channels = Array.isArray(rule.channels)
    ? rule.channels
    : JSON.parse(rule.channels || "[]");
  const previews: Record<string, any> = {};

  for (const channel of channels) {
    switch (channel) {
      case "DISCORD":
        previews[channel] = {
          type: "embed",
          content: {
            title: `🚨 ${rule.name}`,
            description: result.message || "Alerte déclenchée",
            color: getSeverityColor(rule.severity),
            timestamp: new Date().toISOString(),
            footer: {
              text: `Alerte ${rule.severity} • FRENCHOY`,
            },
          },
        };
        break;

      case "TELEGRAM":
        previews[channel] = {
          type: "message",
          content: `🚨 *${rule.name}*\n\n${
            result.message || "Alerte déclenchée"
          }\n\n_Alerte ${rule.severity} • FRENCHOY_`,
          parseMode: "Markdown",
        };
        break;

      case "IN_APP":
        previews[channel] = {
          type: "notification",
          content: {
            title: rule.name,
            message: result.message || "Alerte déclenchée",
            severity: rule.severity,
            timestamp: new Date().toISOString(),
          },
        };
        break;

      default:
        previews[channel] = {
          type: "generic",
          content: result.message || "Alerte déclenchée",
        };
    }
  }

  return previews;
}

function getSeverityColor(severity: string): number {
  switch (severity) {
    case "CRITICAL":
      return 0xdc2626; // Rouge vif
    case "HIGH":
      return 0xf59e0b; // Orange
    case "MEDIUM":
      return 0x3b82f6; // Bleu
    case "LOW":
      return 0x10b981; // Vert
    default:
      return 0x6b7280; // Gris
  }
}
