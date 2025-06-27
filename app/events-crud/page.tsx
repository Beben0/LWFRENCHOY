"use client";

import { EventForm } from "@/components/events/event-form";
import { hasPermission } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function EventsCrudContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const editId = searchParams.get("edit");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(!!editId);

  // Vérification des permissions
  useEffect(() => {
    if (session.status === "authenticated") {
      const canCreate = hasPermission(session.data, "create_event");
      const canEdit = hasPermission(session.data, "edit_event");

      if (editId && !canEdit) {
        alert("Vous n'avez pas la permission de modifier des événements.");
        router.push("/events");
        return;
      }

      if (!editId && !canCreate) {
        alert("Vous n'avez pas la permission de créer des événements.");
        router.push("/events");
        return;
      }
    }
  }, [session, editId, router]);

  // Charger l'événement à modifier
  useEffect(() => {
    if (editId) {
      fetchEvent();
    }
  }, [editId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${editId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else {
        alert("Événement non trouvé");
        router.push("/events");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      alert("Erreur lors du chargement de l'événement");
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Rediriger vers la liste des événements après sauvegarde
    router.push("/events");
  };

  const handleCancel = () => {
    router.push("/events");
  };

  // Affichage du loading pendant le chargement de l'événement
  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  // Affichage de la page
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <EventForm event={event} onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  );
}

export default function EventsCrudPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black p-6 flex items-center justify-center">
          <div className="text-white">Chargement...</div>
        </div>
      }
    >
      <EventsCrudContent />
    </Suspense>
  );
}
