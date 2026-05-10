import { useCallback, useEffect, useState } from "react";
import { Pet } from "../types";

export function usePet(intervalMs = 5000) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/pet", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Pet;
      setPet(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown");
    }
  }, []);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs, refetch]);

  return { pet, error, setPet, refetch };
}
