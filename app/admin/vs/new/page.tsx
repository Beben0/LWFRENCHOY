"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { Calendar, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewVSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5); // 6 jours plus tard
      return d.toISOString().split("T")[0];
    })()
  );
  const [enemyName, setEnemyName] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !hasPermission(session, "create_vs_week")) {
      redirect("/auth/signin");
    }
  }, [session, status]);

  const createVS = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/vs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, enemyName, title }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur API");
      }
      const vs = await res.json();
      router.push(`/admin/vs/${vs.id}`);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-5 h-5" /> Nouveau VS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              placeholder="VS Semaine ..."
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Alliance ennemie</label>
            <input
              type="text"
              value={enemyName}
              onChange={(e) => setEnemyName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              placeholder="Nom de l'alliance"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
            </div>
          </div>

          <Button onClick={createVS} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Création..." : "Créer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
