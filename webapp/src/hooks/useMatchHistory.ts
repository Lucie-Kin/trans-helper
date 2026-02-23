import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../api";
import { loadLocalHistory, type LocalMatchRecord } from "../utils/localMatchHistory";

export type MatchHistoryItem = {
  id: string;
  opponent_id: string;
  opponent_kind?: "USER" | "AI" | "GUEST";
  opponent_name?: string | null;
  played_at: string;
  result: "WIN" | "LOSE";
  score_for: number;
  score_against: number;
  match_type: "TOURNAMENT" | "NORMAL";
  source_match_id?: string | null;
};

function localToItem(r: LocalMatchRecord): MatchHistoryItem {
  return {
    id: r.id,
    opponent_id: r.opponent_id,
    opponent_kind: r.opponent_kind,
    opponent_name: r.opponent_name,
    played_at: r.played_at,
    result: r.result,
    score_for: r.score_for,
    score_against: r.score_against,
    match_type: r.match_type,
  };
}

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

      const localItems = loadLocalHistory().map(localToItem);

      try {
        const res = await fetch(`${API_BASE}/tournament/match-history`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) throw new Error("Not JSON");
        const data = await res.json();
        const serverList: MatchHistoryItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : [];

        const serverIds = new Set(serverList.map((i) => i.id));
        const merged = [
          ...serverList,
          ...localItems.filter((i) => !serverIds.has(i.id)),
        ];

        merged.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());

        if (!cancelled) setItems(merged);
      } catch {
        if (!cancelled) setItems(localItems);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { items, loading, error, reload };
}
