import { prisma } from "@/lib/prisma";
import { initializeDefaultPermissions } from "@/lib/role-permissions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Vérifier s'il y a des permissions en base
    const permissionCount = await prisma.rolePermission.count();

    // Si aucune permission n'existe, initialiser les permissions par défaut
    if (permissionCount === 0) {
      console.log(
        "Aucune permission trouvée, initialisation des permissions par défaut..."
      );
      await initializeDefaultPermissions();
    }

    const guestPermissions = await prisma.rolePermission.findMany({
      where: {
        roleType: "GUEST",
        isEnabled: true,
      },
      select: {
        permission: true,
      },
    });

    const permissions = guestPermissions.map((p) => p.permission);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching guest permissions:", error);

    // Fallback permissions
    return NextResponse.json({
      permissions: ["view_trains", "view_events"],
    });
  }
}
