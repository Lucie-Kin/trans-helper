import { useEffect, useState } from "react";

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("https://localhost:8443/tournament/match-history", {
          credentials: "include",
        });
        console.log("Bonjour", res);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log("OK");
        const data = await res.json();
        console.log(data);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        console.log(e?.message);
        setError(e?.message ?? "Failed to load match history");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading, error };
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
