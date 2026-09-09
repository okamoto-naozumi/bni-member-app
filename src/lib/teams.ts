import { supabase } from "@/lib/supabase";

export interface Team {
  id: string;
  name: string;
}

const DUMMY_STORAGE_KEY = "bni-teams";

const DEFAULT_TEAMS = ["ビジター委員会", "エデュケーション委員会", "PR委員会", "メンバーシップ委員会"];

function loadDummyTeams(): Team[] {
  if (typeof window === "undefined") {
    return DEFAULT_TEAMS.map((name) => ({ id: `team-${name}`, name }));
  }
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = DEFAULT_TEAMS.map((name) => ({
      id: crypto.randomUUID(),
      name,
    }));
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

function saveDummyTeams(teams: Team[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(teams));
}

export async function fetchTeams(): Promise<Team[]> {
  if (supabase) {
    const { data, error } = await supabase.from("teams").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Team[];
  }
  return loadDummyTeams();
}

export async function createTeam(name: string): Promise<Team> {
  if (supabase) {
    const { data, error } = await supabase
      .from("teams")
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data as Team;
  }

  const team: Team = { id: crypto.randomUUID(), name };
  const teams = loadDummyTeams();
  teams.push(team);
  saveDummyTeams(teams);
  return team;
}

export async function updateTeam(id: string, name: string): Promise<Team> {
  if (supabase) {
    const { data, error } = await supabase
      .from("teams")
      .update({ name })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Team;
  }

  const teams = loadDummyTeams();
  const index = teams.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("チームが見つかりません");
  teams[index] = { ...teams[index], name };
  saveDummyTeams(teams);
  return teams[index];
}

export async function deleteTeam(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const teams = loadDummyTeams().filter((t) => t.id !== id);
  saveDummyTeams(teams);
}
