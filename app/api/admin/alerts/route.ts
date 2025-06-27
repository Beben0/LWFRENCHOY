import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer toutes les règles d'alerte
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("active");

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === "true";

    const alertRules = await prisma.alertRule.findMany({
      where,
      include: {
        alerts: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rules: alertRules });
  } catch (error) {
    console.error("Error fetching alert rules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle règle d'alerte
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      conditions,
      severity,
      channels,
      cooldown,
      isActive,
    } = body;

    // Validation
    if (!name || !type || !conditions || !channels) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alertRule = await prisma.alertRule.create({
      data: {
        name,
        description,
        type,
        conditions,
        severity: severity || "MEDIUM",
        channels,
        cooldown: cooldown || 3600,
        isActive: isActive !== false,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(alertRule, { status: 201 });
  } catch (error) {
    console.error("Error creating alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une règle d'alerte
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    }

    const alertRule = await prisma.alertRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(alertRule);
  } catch (error) {
    console.error("Error updating alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une règle d'alerte
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    }

    await prisma.alertRule.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Alert rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
