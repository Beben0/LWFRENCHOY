"use client";

import { ToastProvider } from "@/components/ui/toast";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </NextAuthSessionProvider>
  );
}
