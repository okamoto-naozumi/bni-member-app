import { supabase } from "@/lib/supabase";

export interface SharedTeam {
  id: string;
  /** 外部共有ページに表示するチーム名(例: 建築チーム) */
  name: string;
  /** 共有対象メンバーのID配列。表示順もこの配列順に従う。 */
  member_ids: string[];
  created_at: string;
}

export interface SharedTeamInput {
  name: string;
  member_ids: string[];
}

const DUMMY_STORAGE_KEY = "bni-dummy-shared-teams-v1";

function loadDummySharedTeams(): SharedTeam[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SharedTeam[];
  } catch {
    return [];
  }
}

function saveDummySharedTeams(teams: SharedTeam[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(teams));
}

function normalize(t: SharedTeam): SharedTeam {
  return {
    ...t,
    member_ids: Array.isArray(t.member_ids) ? t.member_ids : [],
  };
}

export async function createSharedTeam(input: SharedTeamInput): Promise<SharedTeam> {
  if (supabase) {
    const { data, error } = await supabase
      .from("shared_teams")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return normalize(data as SharedTeam);
  }

  const team: SharedTeam = {
    id: crypto.randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  const teams = loadDummySharedTeams();
  teams.unshift(team);
  saveDummySharedTeams(teams);
  return team;
}

export async function fetchSharedTeamById(id: string): Promise<SharedTeam | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("shared_teams")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? normalize(data as SharedTeam) : null;
  }

  const team = loadDummySharedTeams().find((t) => t.id === id);
  return team ? normalize(team) : null;
}
