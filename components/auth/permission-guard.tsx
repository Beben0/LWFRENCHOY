"use client";

import { hasAnyPermission, hasPermission, Permission } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // Si true, nécessite toutes les permissions
  fallback?: ReactNode;
  showForGuests?: boolean; // Afficher même pour les invités
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showForGuests = false,
}: PermissionGuardProps) {
  const { data: session } = useSession();

  // Si showForGuests est true, on affiche toujours
  if (showForGuests) {
    return <>{children}</>;
  }

  // Vérification d'une permission unique
  if (permission) {
    const hasAccess = hasPermission(session, permission);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Vérification de plusieurs permissions
  if (permissions.length > 0) {
    const hasAccess = requireAll
      ? permissions.every((perm) => hasPermission(session, perm))
      : hasAnyPermission(session, permissions);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Par défaut, on affiche le contenu
  return <>{children}</>;
}
