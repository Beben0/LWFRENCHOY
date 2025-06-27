import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let exportLog: any = null;

  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const format = url.searchParams.get("format") || "csv";

    let data: any = [];
    let filename = "";

    // Créer le log d'export initial
    exportLog = await prisma.exportLog.create({
      data: {
        type: type || "Unknown",
        format,
        filename: "",
        userId: session.user.id || "",
        userEmail: session.user.email || "",
        status: "IN_PROGRESS",
      },
    });

    switch (type) {
      case "Membres":
        const rawMembers = await prisma.member.findMany({
          select: {
            pseudo: true,
            level: true,
            power: true,
            kills: true,
            specialty: true,
            allianceRole: true,
            status: true,
            notes: true,
            lastActive: true,
            createdAt: true,
          },
        });
        // Convertir BigInt en string pour éviter l'erreur de sérialisation
        data = rawMembers.map((member) => ({
          ...member,
          power: member.power.toString(),
        }));
        filename = "membres";
        break;

      case "Trains":
        data = await prisma.trainSlot.findMany({
          include: {
            conductor: {
              select: {
                pseudo: true,
              },
            },
          },
        });
        filename = "trains";
        break;

      case "Événements":
        data = await prisma.event.findMany();
        filename = "evenements";
        break;

      case "Utilisateurs":
        data = await prisma.user.findMany({
          select: {
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        filename = "utilisateurs";
        break;

      case "Complet":
        const [rawMembersComplet, trains, events, users] = await Promise.all([
          prisma.member.findMany(),
          prisma.trainSlot.findMany({ include: { conductor: true } }),
          prisma.event.findMany(),
          prisma.user.findMany({
            select: {
              email: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        ]);
        // Convertir BigInt pour éviter l'erreur de sérialisation
        const membersComplet = rawMembersComplet.map((member) => ({
          ...member,
          power: member.power.toString(),
        }));
        data = { members: membersComplet, trains, events, users };
        filename = "export_complet";
        break;

      default:
        return NextResponse.json(
          { error: "Type not supported" },
          { status: 400 }
        );
    }

    // Calculer les métriques d'export
    const duration = Date.now() - startTime;
    const recordCount = Array.isArray(data)
      ? data.length
      : Object.keys(data).reduce(
          (acc, key) => acc + (Array.isArray(data[key]) ? data[key].length : 1),
          0
        );

    let content: string;
    let contentType: string;
    let finalFilename: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      contentType = "application/json";
      finalFilename = `${filename}.json`;
    } else {
      // CSV format
      let csv = "";
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        csv = headers.join(",") + "\n";
        csv += data
          .map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                if (value === null || value === undefined) return "";
                if (typeof value === "object") return JSON.stringify(value);
                return `"${value.toString().replace(/"/g, '""')}"`;
              })
              .join(",")
          )
          .join("\n");
      }
      content = csv;
      contentType = "text/csv";
      finalFilename = `${filename}.csv`;
    }

    const fileSize = Buffer.byteLength(content, "utf8");

    // Mettre à jour le log d'export avec les résultats
    if (exportLog) {
      await prisma.exportLog.update({
        where: { id: exportLog.id },
        data: {
          filename: finalFilename,
          recordCount,
          fileSize: BigInt(fileSize),
          status: "COMPLETED",
          duration,
        },
      });
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);

    // Mettre à jour le log d'export en cas d'erreur
    const duration = Date.now() - startTime;
    if (exportLog) {
      try {
        await prisma.exportLog.update({
          where: { id: exportLog.id },
          data: {
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            duration,
          },
        });
      } catch (logError) {
        console.error("Failed to update export log:", logError);
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
