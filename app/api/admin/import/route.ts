import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let importLog: any = null;

  try {
    const session = await auth();
    if (!session || !hasPermission(session, "import_data")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Détecter le format du fichier
    const format = file.name.split(".").pop()?.toLowerCase() || "unknown";
    const validFormats = ["csv", "json", "xlsx"];

    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          error: `Format non supporté: ${format}. Formats acceptés: ${validFormats.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Créer le log d'import initial
    importLog = await prisma.importLog.create({
      data: {
        type: type || "Unknown",
        format,
        originalName: file.name,
        fileSize: BigInt(file.size),
        userId: session.user.id || "",
        userEmail: session.user.email || "",
        status: "IN_PROGRESS",
      },
    });

    const content = await file.text();
    let data: any[] = [];
    let recordCount = 0;

    // Parse selon le type de fichier
    if (format === "json") {
      const parsed = JSON.parse(content);
      data = Array.isArray(parsed) ? parsed : [parsed];
      recordCount = data.length;
    } else if (format === "csv") {
      // Parser CSV amélioré
      const lines = content.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        throw new Error("Le fichier CSV est vide ou n'a pas d'en-têtes");
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));
      data = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line, index) => {
          // Parser CSV plus robuste
          const values: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Dernier champ

          const obj: any = { _lineNumber: index + 2 }; // +2 car on commence à la ligne 2
          headers.forEach((header, index) => {
            obj[header] = values[index]?.replace(/^"|"$/g, "") || null;
          });
          return obj;
        });
      recordCount = data.length;
    }

    // Mettre à jour le count initial
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: { recordCount },
    });

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errorDetails: any[] = [];

    // Traiter les données selon le type
    switch (type) {
      case "Membres":
        for (const [index, item] of data.entries()) {
          processedCount++;
          try {
            // Validation des champs requis
            if (!item.pseudo || !item.pseudo.trim()) {
              errorCount++;
              errorDetails.push({
                line: item._lineNumber || index + 1,
                error: "Pseudo requis",
                data: item,
              });
              continue;
            }

            await prisma.member.upsert({
              where: { pseudo: item.pseudo.trim() },
              update: {
                level: parseInt(item.level) || 1,
                power: BigInt(item.power || 0),
                kills: parseInt(item.kills) || 0,
                specialty: item.specialty || null,
                allianceRole: item.allianceRole || "MEMBER",
                status: item.status || "ACTIVE",
                notes: item.notes || null,
                lastActive: item.lastActive
                  ? new Date(item.lastActive)
                  : new Date(),
              },
              create: {
                pseudo: item.pseudo.trim(),
                level: parseInt(item.level) || 1,
                power: BigInt(item.power || 0),
                kills: parseInt(item.kills) || 0,
                specialty: item.specialty || null,
                allianceRole: item.allianceRole || "MEMBER",
                status: item.status || "ACTIVE",
                notes: item.notes || null,
                lastActive: item.lastActive
                  ? new Date(item.lastActive)
                  : new Date(),
              },
            });
            successCount++;
          } catch (error) {
            errorCount++;
            errorDetails.push({
              line: item._lineNumber || index + 1,
              error: error instanceof Error ? error.message : "Erreur inconnue",
              data: item,
            });
            console.error(`Error importing member ${item.pseudo}:`, error);
          }
        }
        break;

      case "Événements":
        for (const [index, item] of data.entries()) {
          processedCount++;
          try {
            // Validation des champs requis
            if (!item.title || !item.title.trim()) {
              errorCount++;
              errorDetails.push({
                line: item._lineNumber || index + 1,
                error: "Titre requis",
                data: item,
              });
              continue;
            }

            if (!item.startDate) {
              errorCount++;
              errorDetails.push({
                line: item._lineNumber || index + 1,
                error: "Date de début requise",
                data: item,
              });
              continue;
            }

            await prisma.event.create({
              data: {
                title: item.title.trim(),
                description: item.description || null,
                detailedDescription: item.detailedDescription || null,
                type: item.type || "AUTRE",
                tags: item.tags
                  ? item.tags.split(",").map((t: string) => t.trim())
                  : [],
                startDate: new Date(item.startDate),
                endDate: item.endDate ? new Date(item.endDate) : null,
                isRecurring: item.isRecurring === "true" || false,
                recurringDays: item.recurringDays
                  ? item.recurringDays.split(",").map((d: string) => d.trim())
                  : [],
                recurringEndDate: item.recurringEndDate
                  ? new Date(item.recurringEndDate)
                  : null,
              },
            });
            successCount++;
          } catch (error) {
            errorCount++;
            errorDetails.push({
              line: item._lineNumber || index + 1,
              error: error instanceof Error ? error.message : "Erreur inconnue",
              data: item,
            });
            console.error(`Error importing event ${item.title}:`, error);
          }
        }
        break;

      case "Trains":
        for (const [index, item] of data.entries()) {
          processedCount++;
          try {
            // Validation des champs requis
            if (!item.day || !item.departureTime) {
              errorCount++;
              errorDetails.push({
                line: item._lineNumber || index + 1,
                error: "Jour et heure de départ requis",
                data: item,
              });
              continue;
            }

            let conductorId = null;
            const memberPseudo = item.memberPseudo || item.conductor;

            if (memberPseudo && memberPseudo.trim()) {
              const member = await prisma.member.findUnique({
                where: { pseudo: memberPseudo.trim() },
              });

              if (!member) {
                errorCount++;
                errorDetails.push({
                  line: item._lineNumber || index + 1,
                  error: `Membre "${memberPseudo}" non trouvé`,
                  data: item,
                });
                continue;
              }
              conductorId = member.id;
            }

            await prisma.trainSlot.upsert({
              where: {
                day: item.day.trim().toLowerCase(),
              },
              update: {
                departureTime: item.departureTime.trim(),
                conductorId,
              },
              create: {
                day: item.day.trim().toLowerCase(),
                departureTime: item.departureTime.trim(),
                conductorId,
              },
            });
            successCount++;
          } catch (error) {
            errorCount++;
            errorDetails.push({
              line: item._lineNumber || index + 1,
              error: error instanceof Error ? error.message : "Erreur inconnue",
              data: item,
            });
            console.error(`Error importing train slot:`, error);
          }
        }
        break;

      default:
        throw new Error(`Type d'import non supporté: ${type}`);
    }

    const duration = Date.now() - startTime;

    // Mettre à jour le log d'import avec les résultats
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        processedCount,
        successCount,
        errorCount,
        skippedCount,
        status: errorCount > 0 && successCount === 0 ? "FAILED" : "COMPLETED",
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        duration,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      importId: importLog.id,
      summary: {
        recordCount,
        processedCount,
        successCount,
        errorCount,
        skippedCount,
        duration,
      },
      message: `Import terminé: ${successCount}/${recordCount} enregistrements importés avec succès`,
      errors: errorDetails.length > 0 ? errorDetails.slice(0, 10) : undefined, // Limiter à 10 erreurs pour la réponse
    });
  } catch (error) {
    console.error("Import error:", error);

    const duration = Date.now() - startTime;

    // Mettre à jour le log d'import en cas d'erreur
    if (importLog) {
      try {
        await prisma.importLog.update({
          where: { id: importLog.id },
          data: {
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : "Erreur inconnue",
            duration,
            completedAt: new Date(),
          },
        });
      } catch (logError) {
        console.error("Failed to update import log:", logError);
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
        importId: importLog?.id,
      },
      { status: 500 }
    );
  }
}
