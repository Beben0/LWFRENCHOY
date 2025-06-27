import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer une règle spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const rule = await prisma.alertRule.findUnique({
      where: { id },
      include: {
        alerts: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error fetching alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Modifier une règle existante
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      isActive,
      conditions,
      severity,
      channels,
      cooldown,
    } = body;

    // Validation des données
    if (!name || !type || !conditions || !severity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Vérifier que la règle existe
    const { id } = await params;
    const existingRule = await prisma.alertRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Mettre à jour la règle
    const updatedRule = await prisma.alertRule.update({
      where: { id },
      data: {
        name,
        description,
        type,
        isActive: isActive !== undefined ? isActive : true,
        conditions,
        severity,
        channels,
        cooldown: cooldown || 3600,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Rule updated successfully",
      rule: updatedRule,
    });
  } catch (error) {
    console.error("Error updating alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une règle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "manage_alerts")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Vérifier que la règle existe
    const { id } = await params;
    const existingRule = await prisma.alertRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Supprimer la règle (cascade supprimera les alertes liées)
    await prisma.alertRule.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
