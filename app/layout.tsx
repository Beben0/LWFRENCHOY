import { AlertSchedulerInit } from "@/components/alert-scheduler-init";
import { Navigation } from "@/components/navigation";
import { NotificationWrapper } from "@/components/notification-wrapper";
import { preloadPermissions } from "@/lib/permissions";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frenchoy - Last War",
  description: "Gestionnaire d'alliance pour Last War: Survival Game",
  keywords: ["Last War", "alliance", "jeu", "survie", "gestion"],
  authors: [{ name: "Beben0" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Précharger les permissions au démarrage
  await preloadPermissions();

  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          <NotificationWrapper>
            <AlertSchedulerInit />
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="container mx-auto px-4 py-6">{children}</main>
            </div>
          </NotificationWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
