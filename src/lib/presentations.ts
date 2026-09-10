import { supabase } from "@/lib/supabase";
import { uploadPresentationMaterial } from "@/lib/presentationMaterials";
import { fileToDataUrl } from "@/lib/fileToDataUrl";

export interface Presentation {
  id: string;
  /** プレゼン実施日("YYYY-MM-DD") */
  presentation_date: string;
  /** 担当メンバーID。未割り当ての場合はnull */
  member_id: string | null;
  theme: string;
  material_url: string;
  material_name: string;
  created_at: string;
}

export interface PresentationInput {
  presentation_date: string;
  member_id: string | null;
  theme: string;
}

export interface PresentationMaterialFile {
  file?: File | null;
  removeMaterial?: boolean;
}

const DUMMY_STORAGE_KEY = "bni-dummy-presentations-v1";

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildSeedPresentations(): Presentation[] {
  return [
    {
      id: "dummy-presentation-1",
      presentation_date: todayPlus(3),
      member_id: "dummy-1",
      theme: "相続税申告サービスのご紹介",
      material_url: "",
      material_name: "",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-presentation-2",
      presentation_date: todayPlus(10),
      member_id: "dummy-3",
      theme: "DX支援の進め方",
      material_url: "",
      material_name: "",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-presentation-3",
      presentation_date: todayPlus(-7),
      member_id: "dummy-4",
      theme: "ブランディングデザイン事例紹介",
      material_url: "",
      material_name: "",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyPresentations(): Presentation[] {
  if (typeof window === "undefined") return buildSeedPresentations();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedPresentations();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Presentation[];
  } catch {
    const seeded = buildSeedPresentations();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyPresentations(presentations: Presentation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(presentations));
}

/**
 * DBのnull値を安全に補完する。既存データとの互換性維持のためのフォールバック。
 */
function normalizePresentation(p: Presentation): Presentation {
  return {
    ...p,
    member_id: p.member_id ?? null,
    theme: p.theme ?? "",
    material_url: p.material_url ?? "",
    material_name: p.material_name ?? "",
  };
}

export async function fetchPresentations(): Promise<Presentation[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .order("presentation_date", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Presentation[]).map(normalizePresentation);
  }
  return loadDummyPresentations().sort((a, b) =>
    a.presentation_date.localeCompare(b.presentation_date)
  );
}

async function resolveMaterial(
  file: File | null | undefined,
  removeMaterial: boolean | undefined,
  fallback: { material_url: string; material_name: string },
  presentationId: string
): Promise<{ material_url: string; material_name: string }> {
  if (file) {
    const material_url = supabase
      ? await uploadPresentationMaterial(file, presentationId)
      : await fileToDataUrl(file);
    return { material_url, material_name: file.name };
  }
  if (removeMaterial) return { material_url: "", material_name: "" };
  return fallback;
}

export async function createPresentation(
  input: PresentationInput,
  materialFile: PresentationMaterialFile = {}
): Promise<Presentation> {
  const id = crypto.randomUUID();
  const { material_url, material_name } = await resolveMaterial(
    materialFile.file,
    materialFile.removeMaterial,
    { material_url: "", material_name: "" },
    id
  );

  if (supabase) {
    const { data, error } = await supabase
      .from("presentations")
      .insert({ id, ...input, material_url, material_name })
      .select()
      .single();
    if (error) throw error;
    return normalizePresentation(data as Presentation);
  }

  const presentation: Presentation = {
    id,
    ...input,
    material_url,
    material_name,
    created_at: new Date().toISOString(),
  };
  const presentations = loadDummyPresentations();
  presentations.push(presentation);
  saveDummyPresentations(presentations);
  return presentation;
}

export async function updatePresentation(
  id: string,
  input: PresentationInput,
  materialFile: PresentationMaterialFile,
  existing: { material_url: string; material_name: string }
): Promise<Presentation> {
  const { material_url, material_name } = await resolveMaterial(
    materialFile.file,
    materialFile.removeMaterial,
    existing,
    id
  );

  if (supabase) {
    const { data, error } = await supabase
      .from("presentations")
      .update({ ...input, material_url, material_name })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return normalizePresentation(data as Presentation);
  }

  const presentations = loadDummyPresentations();
  const index = presentations.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("プレゼン予定が見つかりません");
  const updated: Presentation = {
    ...presentations[index],
    ...input,
    material_url,
    material_name,
  };
  presentations[index] = updated;
  saveDummyPresentations(presentations);
  return updated;
}

export async function deletePresentation(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("presentations").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  saveDummyPresentations(loadDummyPresentations().filter((p) => p.id !== id));
}

/**
 * 今日以降で最も近いプレゼン予定を返す(リマインドバナー用)。
 */
export function getNextPresentation(presentations: Presentation[]): Presentation | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = presentations
    .filter((p) => p.presentation_date >= today)
    .sort((a, b) => a.presentation_date.localeCompare(b.presentation_date));
  return upcoming[0] ?? null;
}

/**
 * 今日からの残り日数を返す(0=当日、負の値は過去)。
 */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
