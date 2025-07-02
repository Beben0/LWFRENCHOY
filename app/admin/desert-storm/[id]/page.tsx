"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { DesertStormManager } from "@/components/desert-storm/desert-storm-manager";
import { Button } from "@/components/ui/button";
import { Translate } from "@/components/ui/translate";
import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DesertStormEventPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <PermissionGuard permission="view_desert_storm">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/desert-storm">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <Translate>Retour</Translate>
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-orange-500" />
              <Translate>Gestion événement Desert Storm</Translate>
            </h1>
            <p className="text-muted-foreground">
              <Translate>
                Gérer les participants et résultats de l'événement
              </Translate>
            </p>
          </div>
        </div>

        {/* Composant de gestion */}
        <DesertStormManager eventId={id} />
      </div>
    </PermissionGuard>
  );
}
