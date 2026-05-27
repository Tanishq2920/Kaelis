import type { Database } from "@/integrations/supabase/types";

export type Ring = "inner" | "middle" | "outer";
export type MatchTier = "high" | "medium" | "low";
export type ContextType = "session" | "topic" | "situation";

export interface Quest {
  id: string;
  name: string;
  initial: string;
  quest: string;
  ring: Ring;
  tier: MatchTier;
  match: number;
  /** angle in degrees on the radar */
  angle: number;
  why: string;
  opener: string;
  /** Context strip data */
  contextType: ContextType;
  justAttended: string | null;
  currentSituation: string | null;
  freeUntil: string | null;
  conversationGoal: string | null;
  topic: string | null;
  conceptualOverlap?: string;
  collaborationDirection?: string;
  conversationDepth?: string;
  suggestedAdjacentDirections?: string[];
  pullFactor?: number;
  energyPulse?: boolean;
  distanceStr?: string;
  proximityWarmth?: string;
  isQuietMode?: boolean;
}

/** The currently signed-in user's full profile, sourced from the single
 *  quests row where is_viewer = true. */
export interface Viewer {
  id: string;
  name: string;
  initial: string;
  role: string;
  company: string;
  bio: string;
  questText: string;
  interests: string[];
  expiresAt: string;
}

export const RING_RADIUS: Record<Ring, number> = {
  inner: 95,
  middle: 165,
  outer: 235,
};

export type QuestRow = Database["public"]["Tables"]["quests"]["Row"] & {
  // Newly added flexible-context columns. Typed loosely until the
  // generated types catch up.
  context_type?: string | null;
  just_attended?: string | null;
  current_situation?: string | null;
  free_until?: string | null;
  conversation_goal?: string | null;
};
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Deterministic angle (0–359) derived from the quest UUID so dots stay
 * pinned in place across re-renders, but vary organically across rows. */
export function angleFromId(id: string): number {
  return Math.abs(hash(id)) % 360;
}

function normalizeContext(v: string | null | undefined): ContextType {
  return v === "session" || v === "situation" ? v : "topic";
}

/** Map a Supabase `quests` row (and optional matches row) into the Quest
 * shape the radar/sheet UI already expects. */
export function rowToQuest(row: QuestRow, match?: MatchRow): Quest {
  const ring: Ring =
    row.zone === "inner" || row.zone === "middle" || row.zone === "outer" ? row.zone : "outer";
  const matched = !!match;
  const score = match?.match_score ?? 50 + (Math.abs(hash(row.id)) % 22);
  const tier: MatchTier = matched ? "high" : score >= 70 ? "high" : score >= 55 ? "medium" : "low";

  return {
    id: row.id,
    name: row.name,
    initial: row.initial,
    quest: row.quest_text,
    ring,
    tier,
    match: score,
    angle: angleFromId(row.id),
    why:
      match?.why_explanation ??
      `${row.name}'s quest overlaps with yours on ${
        row.quest_tags.slice(0, 2).join(", ") || "intent"
      }. Worth a short hello.`,
    opener:
      match?.suggested_opener ??
      `Hey ${row.name} — saw your quest pop up on the radar. Got a few minutes?`,
    contextType: normalizeContext(row.context_type),
    justAttended: row.just_attended ?? null,
    currentSituation: row.current_situation ?? null,
    freeUntil: row.free_until ?? null,
    conversationGoal: row.conversation_goal ?? null,
    topic: row.quest_tags?.[0] ?? null,
  };
}

export function rowToViewer(row: QuestRow): Viewer {
  return {
    id: row.id,
    name: row.name,
    initial: row.initial,
    role: row.role,
    company: row.company,
    bio: row.bio,
    questText: row.quest_text,
    interests: row.interests,
    expiresAt: row.expires_at,
  };
}
