"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { Translate } from "@/components/ui/translate";
import {
  BarChart3,
  BookOpen,
  Calculator,
  Calendar,
  LogIn,
  LogOut,
  Menu,
  Shield,
  Sword,
  Target,
  Train,
  Users,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function Navigation() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Shield,
      permission: "view_dashboard" as const,
      requiresAdminRole: false,
      requiresOfficerRole: false,
    },
    {
      href: "/members-crud",
      label: "Membres",
      icon: Users,
      permission: "view_members" as const,
    },
    {
      href: "/trains",
      label: "Trains",
      icon: Train,
      permission: "view_trains" as const,
    },
    {
      href: "/vs",
      label: "VS Wars",
      icon: Sword,
      permission: "view_vs" as const,
    },
    {
      href: "/desert-storm",
      label: "Desert Storm",
      icon: Target,
      permission: "view_desert_storm" as const,
    },
    {
      href: "/calculator",
      label: "Calculateur",
      icon: Calculator,
      permission: "view_calculator" as const,
    },
    {
      href: "/events",
      label: "Événements",
      icon: Calendar,
      permission: "view_events" as const,
    },
    {
      href: "/help",
      label: "Aide",
      icon: BookOpen,
      permission: "view_help" as const,
    },
    {
      href: "/stats",
      label: "Stats",
      icon: BarChart3,
      permission: "view_stats" as const,
    },
  ];

  // Filtrer les éléments de navigation selon les rôles
  const filteredNavigationItems = navigationItems.filter((item) => {
    if (item.requiresAdminRole && session?.user?.role !== "ADMIN") {
      return false;
    }
    if (item.requiresOfficerRole) {
      const member = (session?.user as any)?.member;
      const allianceRole = member?.allianceRole;
      if (
        allianceRole !== "R4" &&
        allianceRole !== "R5" &&
        session?.user?.role !== "ADMIN"
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center space-x-3 text-xl font-bold"
          >
            <div className="relative w-10 h-10 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
              <div className="absolute inset-0.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                <div className="w-full h-full bg-black/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-black text-xs tracking-wider drop-shadow-lg">
                    FROY
                  </span>
                </div>
              </div>
              <div className="absolute top-0 left-1 w-2 h-2 bg-white/30 rounded-full blur-sm"></div>
            </div>
            <span className="lastwar-gradient bg-clip-text text-transparent font-bold tracking-wide">
              Frenchoy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <LanguageSwitcher />

            {filteredNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <PermissionGuard key={item.href} permission={item.permission}>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">
                        <Translate>{item.label}</Translate>
                      </span>
                    </Button>
                  </Link>
                </PermissionGuard>
              );
            })}

            {/* Notifications - Admins seulement */}
            <NotificationDropdown />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="text-right text-sm">
                  <div className="font-medium text-foreground">
                    {session.user.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.user.role === "ADMIN" ? (
                      <Translate>Administrateur</Translate>
                    ) : (
                      <Translate>Membre</Translate>
                    )}
                  </div>
                </div>

                {/* Logout */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">
                    <Translate>Déconnexion</Translate>
                  </span>
                </Button>
              </div>
            ) : (
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    <Translate>Connexion</Translate>
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-border">
            <LanguageSwitcher />

            {filteredNavigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <PermissionGuard key={item.href} permission={item.permission}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      <Icon className="w-4 h-4 mr-2" />
                      <Translate>{item.label}</Translate>
                    </Button>
                  </Link>
                </PermissionGuard>
              );
            })}

            {/* Mobile User Actions */}
            <div className="border-t border-border pt-2 mt-2">
              {session ? (
                <div className="space-y-2">
                  <div className="px-3 py-2">
                    <div className="font-medium text-foreground">
                      {session.user.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.user.role === "ADMIN" ? (
                        <Translate>Administrateur</Translate>
                      ) : (
                        <Translate>Membre</Translate>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <Translate>Déconnexion</Translate>
                  </Button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    <LogIn className="w-4 h-4 mr-2" />
                    <Translate>Connexion</Translate>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
