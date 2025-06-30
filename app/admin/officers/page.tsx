"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Hexagon } from "lucide-react";
import Link from "next/link";

export default function OfficersPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Hexagon className="w-6 h-6 text-yellow-500" /> Hive Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Outil de planification de la ruche pour positionner les bases.
          </p>
          <Link href="/admin/officers/hive-simulator">
            <Button className="flex items-center gap-2">
              <Brain className="w-4 h-4" /> Ouvrir le simulateur
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
