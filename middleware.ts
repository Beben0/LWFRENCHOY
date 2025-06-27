import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Cache pour les permissions GUEST (rafraîchi toutes les 5 minutes)
let guestPermissionsCache: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Mapping des permissions vers les routes
const PERMISSION_TO_ROUTES: Record<string, string[]> = {
  view_trains: ["/trains", "/trains-info"],
  view_events: ["/events"],
  view_members: ["/members", "/members-simple"],
  view_stats: ["/stats"],
};

// Routes toujours publiques (indépendantes des permissions)
const ALWAYS_PUBLIC_ROUTES = ["/", "/auth/signin"];

async function getGuestPermissions(): Promise<Set<string>> {
  const now = Date.now();

  // Vérifier si le cache doit être invalidé (permissions modifiées via admin)
  let shouldInvalidate = false;
  try {
    const { shouldInvalidateMiddlewareCache } = await import(
      "@/lib/role-permissions"
    );
    shouldInvalidate = shouldInvalidateMiddlewareCache();
  } catch (error) {
    // Ignorer l'erreur si la fonction n'est pas disponible
  }

  // Utiliser le cache si disponible, pas expiré, et pas d'invalidation forcée
  if (
    guestPermissionsCache &&
    now - cacheTimestamp < CACHE_DURATION &&
    !shouldInvalidate
  ) {
    return guestPermissionsCache;
  }

  try {
    // Utiliser une API route au lieu de Prisma directement (Edge Runtime compatible)
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/permissions/guest`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { permissions } = (await response.json()) as {
      permissions: string[];
    };
    const permissionsSet = new Set(permissions);

    // Mettre à jour le cache
    guestPermissionsCache = permissionsSet;
    cacheTimestamp = now;

    return permissionsSet;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des permissions GUEST:",
      error
    );

    // Fallback : permissions par défaut en cas d'erreur
    return new Set(["view_trains", "view_events"]);
  }
}

function getPublicRoutesFromPermissions(permissions: Set<string>): string[] {
  const routes = [...ALWAYS_PUBLIC_ROUTES];

  for (const [permission, permissionRoutes] of Object.entries(
    PERMISSION_TO_ROUTES
  )) {
    if (permissions.has(permission)) {
      routes.push(...permissionRoutes);
    }
  }

  return routes;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les ressources statiques et API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Récupérer les permissions GUEST dynamiquement
  const guestPermissions = await getGuestPermissions();
  const publicRoutes = getPublicRoutesFromPermissions(guestPermissions);

  // Vérifier si c'est une route publique
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Pour l'instant, on laisse passer toutes les autres routes
  // La protection sera faite côté composant
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
