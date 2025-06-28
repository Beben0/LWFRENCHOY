import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Récupérer les données de référence pour les articles d'aide
export async function GET() {
  try {
    const session = await auth();
    if (!session || !hasPermission(session, "view_help")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les catégories d'aide
    const categories = await prisma.referenceData.findMany({
      where: {
        category: "HELP_CATEGORY",
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        key: true,
        label: true,
        description: true,
        color: true,
        sortOrder: true,
      },
    });

    // Récupérer les statuts d'aide
    const statuses = await prisma.referenceData.findMany({
      where: {
        category: "HELP_STATUS",
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        key: true,
        label: true,
        description: true,
        color: true,
        sortOrder: true,
      },
    });

    // Récupérer les tags d'aide
    const tags = await prisma.referenceData.findMany({
      where: {
        category: "HELP_TAG",
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        key: true,
        label: true,
        description: true,
        color: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({
      categories,
      statuses,
      tags,
    });
  } catch (error) {
    console.error("Error fetching help reference data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
