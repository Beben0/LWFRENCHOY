// @ts-nocheck
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { jsonify } from "@/lib/utils";
import { VSResult } from "@prisma/client";
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
    console.log("DEBUG - Recherche VS avec ID:", id);
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
    console.log("DEBUG - Résultat de la requête Prisma:", week);

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

// PUT - Mettre à jour les scores d'une semaine VS
export async function PUT(request: NextRequest, context: any) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "edit_vs")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const { id } = context.params;
    const body = await request.json();
    const { allianceScore, enemyScore } = body;

    // Vérifier que les scores sont des nombres valides
    if (typeof allianceScore !== "number" || typeof enemyScore !== "number") {
      return NextResponse.json(
        { error: "Les scores doivent être des nombres" },
        { status: 400 }
      );
    }

    const vsWeek = await prisma.vSWeek.findUnique({
      where: { id },
    });

    if (!vsWeek) {
      return NextResponse.json({ error: "VS introuvable" }, { status: 404 });
    }

    // Déterminer le résultat en fonction des scores
    let result: VSResult | null = null;
    if (allianceScore > enemyScore) result = "VICTORY";
    else if (allianceScore < enemyScore) result = "DEFEAT";
    else result = "DRAW";

    // Mettre à jour les scores et le résultat
    const updatedVSWeek = await prisma.vSWeek.update({
      where: { id },
      data: {
        allianceScore,
        enemyScore,
        result,
      },
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

    return NextResponse.json(jsonify(updatedVSWeek));
  } catch (error) {
    console.error("Erreur lors de la mise à jour des scores VS:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
