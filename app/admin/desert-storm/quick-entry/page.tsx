"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import { hasPermission } from "@/lib/permissions";
import { Save, Target, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  pseudo: string;
}

interface DesertStormEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface ParticipantEntry {
  participantId: string;
  memberId: string;
  pseudo: string;
  points: number;
  kills: number;
  dirty?: boolean;
}

export default function DesertStormQuickEntryPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<DesertStormEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth + load events
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !hasPermission(session, "edit_desert_storm_results")) {
      redirect("/auth/signin");
      return;
    }
    fetchEvents();
  }, [session, status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/desert-storm");
      const data = await res.json();
      const active = (Array.isArray(data) ? data : []).filter(
        (e: DesertStormEvent) => e.status === "ACTIVE"
      );
      setEvents(active);
      if (active.length > 0) {
        setSelectedEventId(active[0].id);
      }
    } catch (e) {
      console.error("Erreur chargement événements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadParticipants(selectedEventId);
    }
  }, [selectedEventId]);

  const loadParticipants = async (eventId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/desert-storm/${eventId}/participants`);
      const data = await res.json();
      const entries: ParticipantEntry[] = data
        .filter((p: any) => p.member)
        .map((p: any) => ({
          participantId: p.id,
          memberId: p.member.id,
          pseudo: p.member.pseudo,
          points: p.points || 0,
          kills: p.totalKills || 0,
        }))
        .sort((a: any, b: any) => a.pseudo.localeCompare(b.pseudo));
      setParticipants(entries);
    } catch (e) {
      console.error("Erreur chargement participants:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (
    participantId: string,
    field: "points" | "kills",
    value: number
  ) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.participantId === participantId
          ? { ...p, [field]: value, dirty: true }
          : p
      )
    );
  };

  const saveChanges = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    try {
      const dirtyEntries = participants.filter((p) => p.dirty);
      await Promise.all(
        dirtyEntries.map((entry) =>
          fetch(`/api/desert-storm/${selectedEventId}/participants`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantId: entry.participantId,
              points: entry.points,
              totalKills: entry.kills,
            }),
          })
        )
      );
      alert("Mise à jour effectuée");
      loadParticipants(selectedEventId);
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <Translate>Chargement...</Translate>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Target className="w-8 h-8 text-orange-500" />
        <Translate>Saisie rapide Desert Storm</Translate>
      </h1>

      {/* Choix de l'événement */}
      {events.length > 1 && (
        <select
          value={selectedEventId ?? ""}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="border p-2 rounded"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <Translate>Participants</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-300">
                <th className="p-2 text-left">
                  <Translate>Membre</Translate>
                </th>
                <th className="p-2">
                  <Translate>Kills</Translate>
                </th>
                <th className="p-2">
                  <Translate>Points</Translate>
                </th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.participantId} className="border-b border-gray-700">
                  <td className="p-2">{p.pseudo}</td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      value={p.kills}
                      onChange={(e) =>
                        updateField(
                          p.participantId,
                          "kills",
                          Number(e.target.value)
                        )
                      }
                      className="w-20 p-1 bg-transparent border rounded text-center"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      value={p.points}
                      onChange={(e) =>
                        updateField(
                          p.participantId,
                          "points",
                          Number(e.target.value)
                        )
                      }
                      className="w-20 p-1 bg-transparent border rounded text-center"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Button onClick={saveChanges} disabled={saving} className="gap-2">
        <Save className="w-4 h-4" />
        {saving ? (
          <Translate>Sauvegarde...</Translate>
        ) : (
          <Translate>Enregistrer</Translate>
        )}
      </Button>
    </div>
  );
}
