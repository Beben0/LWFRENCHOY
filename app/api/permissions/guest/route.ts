import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.rolePermission.findMany({
      where: {
        roleType: "GUEST",
        isEnabled: true,
      },
      select: {
        permission: true,
      },
    });

    const permissions = rows.map((r) => r.permission as Permission);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des permissions GUEST:",
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
