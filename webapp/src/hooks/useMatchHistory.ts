import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../api";

export type MatchHistoryItem = {
  id: string;
  opponent_id: string;
  played_at: string;
  result: "WIN" | "LOSE";
  score_for: number;
  score_against: number;
  match_type: "TOURNAMENT" | "NORMAL";
  source_match_id?: string | null;
};

export function useMatchHistory() {
  const [items, setItems] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/tournament/match-history`, {
          credentials: "include",
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const txt = await res.text();
          throw new Error(`Expected JSON but got: ${txt.slice(0, 100)}`);
        }
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];
        if (!cancelled) {
          setItems(list as MatchHistoryItem[]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load match history");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { items, loading, error, reload };
}
