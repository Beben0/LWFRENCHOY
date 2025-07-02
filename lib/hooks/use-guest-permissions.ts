import { useEffect, useState } from "react";

export function useGuestPermissions(enabled: boolean = true) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function fetchPermissions() {
      try {
        const res = await fetch("/api/permissions/guest");
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = (await res.json()) as { permissions: string[] };
        if (!cancelled) setPermissions(new Set(data.permissions));
      } catch (error) {
        if (!cancelled)
          console.error("Failed to fetch guest permissions", error);
      }
    }

    fetchPermissions();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return permissions;
}
