import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer les configurations de notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_notifications")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await prisma.notificationConfig.findMany({
      orderBy: { channel: "asc" },
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Error fetching notification configs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour une configuration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_notifications")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channel, isEnabled, config } = body;

    if (!channel || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const notificationConfig = await prisma.notificationConfig.upsert({
      where: { channel },
      update: {
        isEnabled: isEnabled !== false,
        config,
      },
      create: {
        channel,
        isEnabled: isEnabled !== false,
        config,
      },
    });

    return NextResponse.json(notificationConfig);
  } catch (error) {
    console.error("Error saving notification config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Tester une configuration ou toggle enable/disable
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_notifications")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, channel, isEnabled, config } = body;

    // Si c'est juste pour toggle enable/disable
    if (action !== "test" && typeof isEnabled === "boolean") {
      // Récupérer la config existante pour ne pas l'écraser
      const existingConfig = await prisma.notificationConfig.findUnique({
        where: { channel },
      });

      if (!existingConfig) {
        // Si pas de config existante, créer avec config vide
        const newConfig = await prisma.notificationConfig.create({
          data: {
            channel,
            isEnabled,
            config: {},
          },
        });
        return NextResponse.json(newConfig);
      }

      // Update en préservant TOUTE la config existante
      const updatedConfig = await prisma.notificationConfig.update({
        where: { channel },
        data: {
          isEnabled,
          // Ne PAS toucher à config - le garder tel quel
        },
      });
      return NextResponse.json(updatedConfig);
    }

    // Pour les tests
    if (action === "test") {
      if (!channel) {
        return NextResponse.json(
          { error: "Channel required for testing" },
          { status: 400 }
        );
      }

      // Récupérer la config existante
      const existingConfig = await prisma.notificationConfig.findUnique({
        where: { channel },
      });

      if (!existingConfig || !existingConfig.config) {
        return NextResponse.json(
          { error: "Configuration not found or incomplete" },
          { status: 400 }
        );
      }

      let testResult = false;
      let testError = null;

      try {
        // Tester la configuration selon le canal
        switch (channel) {
          case "DISCORD":
            testResult = await testDiscordWebhook(existingConfig.config);
            break;
          case "TELEGRAM":
            testResult = await testTelegramBot(existingConfig.config);
            break;
          case "EMAIL":
            testResult = await testEmailConfig(existingConfig.config);
            break;
          default:
            throw new Error(`Unsupported channel: ${channel}`);
        }
      } catch (error: any) {
        testError = error.message;
      }

      // Mettre à jour la configuration avec les résultats du test
      const updatedConfig = await prisma.notificationConfig.update({
        where: { channel },
        data: {
          lastTest: new Date(),
          lastTestStatus: testResult,
          lastTestError: testError,
        },
      });

      return NextResponse.json({
        success: testResult,
        error: testError,
        config: updatedConfig,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error testing notification config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fonction pour tester Discord
async function testDiscordWebhook(config: any): Promise<boolean> {
  const { webhookUrl } = config;

  if (!webhookUrl) {
    throw new Error("Webhook URL manquante");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      embeds: [
        {
          title: "🧪 Test de Configuration",
          description: "Configuration Discord testée avec succès !",
          color: 0xff6b35, // Orange FROY
          timestamp: new Date().toISOString(),
          footer: {
            text: "FROY Frenchoy - Système d'alertes",
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Erreur Discord: ${response.status} ${response.statusText}`
    );
  }

  return true;
}

// Fonction pour tester Telegram
async function testTelegramBot(config: any): Promise<boolean> {
  console.log("Testing Telegram config:", {
    ...config,
    botToken: config.botToken ? "***" : "missing",
  });

  const { botToken, chatId } = config;

  if (!botToken || !chatId) {
    throw new Error("Token bot ou Chat ID manquant");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: "🧪 *Test de Configuration*\n\nConfiguration Telegram testée avec succès !\n\n_FROY Frenchoy - Système d'alertes_",
    parse_mode: "Markdown",
  };

  console.log("Sending to Telegram:", {
    url: url.replace(botToken, "***"),
    payload,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log("Telegram response:", result);

  if (!result.ok) {
    throw new Error(
      `Erreur Telegram: ${result.description || result.error_code}`
    );
  }

  return true;
}

// Fonction pour tester Email (simulé pour l'instant)
async function testEmailConfig(config: any): Promise<boolean> {
  const { smtpHost, smtpPort, smtpUser, smtpPassword } = config;

  if (!smtpHost || !smtpPort || !smtpUser) {
    throw new Error("Configuration SMTP incomplète");
  }

  // Pour l'instant, on simule juste le test
  // Dans un vrai projet, on utiliserait nodemailer ou similar
  return true;
}
