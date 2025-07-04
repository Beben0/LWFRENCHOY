import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventsClientPage from "./client-page";

export default async function EventsPage() {
  const session = await auth();
  const { hasPermissionAsync } = await import("@/lib/permissions");
  const canView = await hasPermissionAsync(session, "view_events");
  if (!canView) {
    redirect("/auth/signin");
  }

  return <EventsClientPage />;
}
