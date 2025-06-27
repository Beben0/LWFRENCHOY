import { ReferenceDataManager } from "@/components/admin/reference-data-manager";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function ReferenceDataPage() {
  const session = await auth();

  if (!session || !hasPermission(session, "view_admin_panel")) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestion des Référentiels
        </h1>
        <p className="text-muted-foreground">
          Administration des tags, spécialités, rôles et types d'événements
        </p>
      </div>

      <PermissionGuard permission="manage_permissions">
        <ReferenceDataManager />
      </PermissionGuard>
    </div>
  );
}
