import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // "export" | "import" | "all"
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let exportLogs: any[] = [];
    let importLogs: any[] = [];

    if (type === "export" || type === "all" || !type) {
      exportLogs = await prisma.exportLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    }

    if (type === "import" || type === "all" || !type) {
      importLogs = await prisma.importLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });
    }

    // Combiner et trier par date (avec conversion BigInt)
    const allLogs = [
      ...exportLogs.map((log) => ({
        ...log,
        logType: "export",
        fileSize: log.fileSize.toString(),
      })),
      ...importLogs.map((log) => ({
        ...log,
        logType: "import",
        fileSize: log.fileSize.toString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);

    // Statistiques
    const stats = {
      totalExports: await prisma.exportLog.count(),
      totalImports: await prisma.importLog.count(),
      recentExports: await prisma.exportLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
          },
        },
      }),
      recentImports: await prisma.importLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
          },
        },
      }),
      failedExports: await prisma.exportLog.count({
        where: { status: "FAILED" },
      }),
      failedImports: await prisma.importLog.count({
        where: { status: "FAILED" },
      }),
    };

    return NextResponse.json({
      logs: allLogs,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: allLogs.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
