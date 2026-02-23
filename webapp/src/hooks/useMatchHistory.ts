import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../api";

export type MatchHistoryItem = {
  id: string;
  opponent_id: string;
  opponent_kind?: "USER" | "AI" | "GUEST";   // NEW
  opponent_name?: string | null;            // NEW
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
          throw new Error(`Expected JSON, got: ${txt}`);
        }
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];
        if (!cancelled)
          setItems(list as MatchHistoryItem[]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load match history");
      } finally {
        if (!cancelled)
          setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { items, loading, error, reload };
}

// 2ND VERSION

/*import { useEffect, useState, useCallback } from "react";

export type MatchHistoryItem = {
  id: string;
  user_id: string;
  opponent_id: string;
  played_at: string;
  result: "WIN" | "LOSE";
  score_for: number;
  score_against: number;
  match_type: "TOURNAMENT" | "NORMAL";
  source_match_id?: string | null;
};

type MatchHistoryState = {
  items: MatchHistoryItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useMatchHistory(): MatchHistoryState {
  const [items, setItems] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
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
        const res = await fetch("https://localhost:8443/tournament/match-history", {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
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
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load match history");
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
}*/