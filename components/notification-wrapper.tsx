"use client";

import { useInAppNotifications } from "@/lib/hooks/use-in-app-notifications";

export function NotificationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le hook gère lui-même la vérification des permissions
  useInAppNotifications();

  return <>{children}</>;
}
