import { supabase } from "@/lib/supabase";

export interface Event {
  id: string;
  title: string;
  /** "YYYY-MM-DDTHH:mm" 形式のローカル日時文字列。タイムゾーン変換によるズレを避けるため timestamptz ではなく素の文字列として扱う */
  start_time: string;
  end_time: string;
  category_id: string | null;
  /** カレンダー表示用の背景色(例: "#3b82f6") */
  color: string;
  description: string;
  location: string;
  zoom_url: string;
  created_at: string;
}

export interface EventInput {
  title: string;
  start_time: string;
  end_time: string;
  category_id: string | null;
  color: string;
  description: string;
  location: string;
  zoom_url: string;
}

export const DEFAULT_EVENT_COLOR = "#3b82f6";

const DUMMY_STORAGE_KEY = "bni-dummy-events-v1";

function buildSeedEvents(): Event[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return [
    {
      id: "dummy-event-1",
      title: "定例会",
      start_time: `${y}-${m}-${d}T07:30`,
      end_time: `${y}-${m}-${d}T09:00`,
      category_id: "dummy-category-1",
      color: DEFAULT_EVENT_COLOR,
      description: "毎週の定例会です。",
      location: "本部会議室",
      zoom_url: "",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyEvents(): Event[] {
  if (typeof window === "undefined") return buildSeedEvents();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedEvents();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as Event[];
  } catch {
    const seeded = buildSeedEvents();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyEvents(events: Event[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(events));
}

function normalizeEvent(e: Event): Event {
  return {
    ...e,
    category_id: e.category_id ?? null,
    color: e.color || DEFAULT_EVENT_COLOR,
    description: e.description ?? "",
    location: e.location ?? "",
    zoom_url: e.zoom_url ?? "",
  };
}

/**
 * Supabaseでの実行を試み、未設定または通信エラーの場合はlocalStorageへ自動フォールバックする。
 * カレンダー機能全体が常にオフラインでも使える状態を優先する意図的な仕様(library_linksと同様)。
 */
async function withLocalFallback<T>(
  run: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!supabase) return fallback();
  try {
    return await run();
  } catch (err) {
    console.warn("[events] Supabaseへのアクセスに失敗したためローカルデータを使用します:", err);
    return fallback();
  }
}

export async function fetchEvents(): Promise<Event[]> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Event[]).map(normalizeEvent);
    },
    () => loadDummyEvents().sort((a, b) => a.start_time.localeCompare(b.start_time))
  );
}

export async function createEvent(input: EventInput): Promise<Event> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!.from("events").insert(input).select().single();
      if (error) throw error;
      return normalizeEvent(data as Event);
    },
    () => {
      const event: Event = {
        id: crypto.randomUUID(),
        ...input,
        created_at: new Date().toISOString(),
      };
      const events = loadDummyEvents();
      events.push(event);
      saveDummyEvents(events);
      return event;
    }
  );
}

export async function updateEvent(id: string, input: EventInput): Promise<Event> {
  return withLocalFallback(
    async () => {
      const { data, error } = await supabase!
        .from("events")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return normalizeEvent(data as Event);
    },
    () => {
      const events = loadDummyEvents();
      const index = events.findIndex((e) => e.id === id);
      if (index === -1) throw new Error("予定が見つかりません");
      events[index] = { ...events[index], ...input };
      saveDummyEvents(events);
      return events[index];
    }
  );
}

export async function deleteEvent(id: string): Promise<void> {
  return withLocalFallback(
    async () => {
      const { error } = await supabase!.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    () => {
      saveDummyEvents(loadDummyEvents().filter((e) => e.id !== id));
    }
  );
}

/**
 * 終了日時が未入力の場合、開始日時と同じ値を適用する(所要時間0分)。
 * 予定登録フォームとCSVインポートの両方から呼ばれる共通ロジック。
 */
export function resolveEndTime(startTime: string, endTime: string): string {
  return endTime.trim() || startTime;
}
