import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!hasPermission(session, "view_admin_panel")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Récupérer les alertes non lues des 24 dernières heures
    const alerts = await prisma.alert.findMany({
      where: {
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h
        },
      },
      include: {
        rule: {
          select: {
            name: true,
            channels: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limiter à 10 alertes
    });

    // Filtrer seulement les alertes avec canal IN_APP
    const inAppAlerts = alerts.filter((alert) =>
      alert.rule.channels.includes("IN_APP")
    );

    return NextResponse.json({ alerts: inAppAlerts });
  } catch (error) {
    console.error("Error fetching unread alerts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!hasPermission(session, "view_admin_panel")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { alertIds } = await request.json();

    if (!Array.isArray(alertIds)) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Marquer les alertes comme lues
    await prisma.alert.updateMany({
      where: {
        id: {
          in: alertIds,
        },
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking alerts as read:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
