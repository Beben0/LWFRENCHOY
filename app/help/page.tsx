import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { redirect } from "next/navigation";
import HelpClientPage from "./client-page";

export default async function HelpPage() {
  const session = await auth();
  const canView = await hasPermissionAsync(session, "view_help");
  if (!canView) {
    redirect("/auth/signin");
  }

  const canEdit = await hasPermissionAsync(session, "edit_help_article");
  const canCreate = await hasPermissionAsync(session, "create_help_article");

  return <HelpClientPage canEdit={canEdit} canCreate={canCreate} />;
}
