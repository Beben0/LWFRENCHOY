import { Session } from "next-auth";
import { getUserRole } from "./permissions";

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

  switch (userRole) {
    case "ADMIN":
      return "/admin";
    case "GUEST":
    default:
      // Les invités vont vers les trains (accessible publiquement)
      return "/trains";
  }
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
