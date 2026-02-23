export type LocalMatchRecord = {
  id: string;
  opponent_id: string;
  opponent_kind: "USER" | "AI" | "GUEST";
  opponent_name: string;
  played_at: string;
  result: "WIN" | "LOSE";
  score_for: number;
  score_against: number;
  match_type: "TOURNAMENT" | "NORMAL";
};

const STORAGE_KEY = "pong_match_history";

export function loadLocalHistory(): LocalMatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalMatchRecord[];
  } catch {
    return [];
  }
}

export function saveMatchToLocal(record: LocalMatchRecord): void {
  const history = loadLocalHistory();
  history.unshift(record);
  if (history.length > 200) history.length = 200;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function generateMatchId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
