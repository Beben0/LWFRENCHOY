import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import {
  createReferenceData,
  deleteReferenceData,
  getAllReferenceCategories,
  getReferenceDataByCategory,
  initializeDefaultReferenceData,
  reorderReferenceData,
  updateReferenceData,
} from "@/lib/reference-data";
import { invalidateReferenceCache } from "@/lib/reference-options";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const referenceDataSchema = z.object({
  category: z.enum([
    "MEMBER_SPECIALTY",
    "MEMBER_TAG",
    "ALLIANCE_ROLE",
    "EVENT_TYPE",
    "EVENT_TAG",
    "TRAIN_TYPE",
    "PRIORITY_LEVEL",
    "STATUS_TYPE",
  ]),
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET - Récupérer les données de référence
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(await hasPermissionAsync(session, "view_admin_panel"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialiser les données par défaut si nécessaire
    await initializeDefaultReferenceData();

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    if (category) {
      // Récupérer les données pour une catégorie spécifique
      const data = await getReferenceDataByCategory(
        category as any,
        !includeInactive
      );
      return NextResponse.json(data);
    } else {
      // Récupérer toutes les catégories
      const categories = await getAllReferenceCategories();
      return NextResponse.json(categories);
    }
  } catch (error) {
    console.error("Error fetching reference data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle donnée de référence
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session ||
      !(await hasPermissionAsync(session, "manage_permissions"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "reorder") {
      // Réorganiser l'ordre des éléments
      const { category, orderedIds } = body;
      await reorderReferenceData(category, orderedIds);
      invalidateReferenceCache();
      return NextResponse.json({ message: "Order updated successfully" });
    } else {
      // Créer une nouvelle donnée
      const data = referenceDataSchema.parse(body);
      const newItem = await createReferenceData(data);
      invalidateReferenceCache();
      return NextResponse.json(newItem, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating reference data:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une donnée de référence
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session ||
      !(await hasPermissionAsync(session, "manage_permissions"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updatedItem = await updateReferenceData(id, data);
    invalidateReferenceCache();
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating reference data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une donnée de référence
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session ||
      !(await hasPermissionAsync(session, "manage_permissions"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await deleteReferenceData(id);
    invalidateReferenceCache();
    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting reference data:", error);
    if (error instanceof Error && error.message.includes("système")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
