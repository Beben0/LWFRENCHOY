import { Session } from "next-auth";
import { getUserRole, hasPermission } from "./permissions";

/**
 * Détermine où rediriger l'utilisateur après connexion
 */
export function getRedirectUrl(
  session: Session | null,
  requestedUrl?: string
): string {
  // Si l'utilisateur a demandé une URL spécifique, la retourner
  if (requestedUrl && requestedUrl !== "/auth/signin") {
    return requestedUrl;
  }

  const userRole = getUserRole(session);

  // Si l'utilisateur (admin ou membre) possède la permission view_dashboard -> dashboard
  if (session && hasPermission(session, "view_dashboard")) {
    return "/dashboard";
  }

  // Admin sans permission explicite (legacy) : dashboard aussi
  if (userRole === "ADMIN") {
    return "/dashboard";
  }

  // Invités : trouver la première route publique qu'ils peuvent voir
  const guestOrder: { path: string; perm: string }[] = [
    { path: "/trains", perm: "view_trains" },
    { path: "/desert-storm", perm: "view_desert_storm" },
    { path: "/vs", perm: "view_vs" },
    { path: "/help", perm: "view_help" },
    { path: "/events", perm: "view_events" },
    { path: "/members", perm: "view_members" },
    { path: "/stats", perm: "view_stats" },
  ];

  for (const { path, perm } of guestOrder) {
    if (session && hasPermission(session, perm as any)) {
      return path;
    }
  }

  // Fallback neutre
  return "/welcome";
}

/**
 * Vérifie si l'utilisateur peut accéder à une route
 */
export function canAccessRoute(
  session: Session | null,
  route: string
): boolean {
  const userRole = getUserRole(session);

  // Routes publiques
  const publicRoutes = ["/", "/auth/signin", "/trains"];
  if (publicRoutes.includes(route)) {
    return true;
  }

  // Routes pour membres connectés (maintenant géré par les permissions d'alliance)
  // const memberRoutes = ["/admin", "/members", "/events", "/stats"];

  // Routes admin
  const adminRoutes = [
    "/admin",
    "/admin/users",
    "/admin/roles",
    "/admin/settings",
    "/admin/import-export",
    "/members",
    "/events",
    "/stats",
  ];
  if (userRole === "ADMIN" && adminRoutes.includes(route)) {
    return true;
  }

  return false;
}
