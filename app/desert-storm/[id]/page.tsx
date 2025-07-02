"use client";

import { DesertStormManager } from "@/components/desert-storm/desert-storm-manager";
import { useParams } from "next/navigation";

export default function DesertStormEventPage() {
  const params = useParams();
  const { id } = params as { id: string };

  if (!id) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <DesertStormManager eventId={id} />
    </div>
  );
}
