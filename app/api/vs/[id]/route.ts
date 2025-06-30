// @ts-nocheck
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer les détails d'une semaine VS
export async function GET(request: NextRequest, context: any) {
  console.log("DEBUG - Début de la route GET /api/vs/[id]");

  try {
    const { id } = context.params;
    console.log("DEBUG - ID reçu:", id);

    console.log("DEBUG - Vérification de l'authentification...");
    const session = await auth();
    if (session && !hasPermission(session, "view_vs")) {
      console.log("DEBUG - Permission refusée");
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }
    console.log("DEBUG - Authentification OK");

    console.log("DEBUG - Début de la requête Prisma...");
    const week = await prisma.vSWeek.findUnique({
      where: { id },
      include: {
        days: true,
        participants: {
          include: {
            member: true,
            dailyResults: {
              orderBy: { dayNumber: "asc" },
            },
          },
        },
      },
    });
    console.log("DEBUG - Requête Prisma terminée");

    if (!week) {
      console.log("DEBUG - VS non trouvé");
      return NextResponse.json({ error: "VS introuvable" }, { status: 404 });
    }
    console.log("DEBUG - VS trouvé, préparation de la réponse");

    const safeWeek = jsonify(week);
    console.log("DEBUG - Données converties pour JSON");

    console.log("DEBUG - Envoi de la réponse");
    return NextResponse.json(safeWeek);
  } catch (error) {
    console.error("DEBUG - Erreur détaillée:", error);
    console.error("DEBUG - Stack trace:", (error as Error).stack);
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: (error as Error).message },
      { status: 500 }
    );
  }
}
