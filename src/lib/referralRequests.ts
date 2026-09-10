import { supabase } from "@/lib/supabase";

export type ReferralRequestStatus = "open" | "in_progress" | "fulfilled";

export const REFERRAL_STATUS_LABELS: Record<ReferralRequestStatus, string> = {
  open: "募集中",
  in_progress: "調整中",
  fulfilled: "充足",
};

export const REFERRAL_STATUS_OPTIONS: ReferralRequestStatus[] = [
  "open",
  "in_progress",
  "fulfilled",
];

export interface ReferralRequest {
  id: string;
  /** 募集カテゴリ(例: 不動産、弁護士) */
  category: string;
  /** 対象パワーチーム */
  power_team: string;
  description: string;
  /** 担当メンバー(紹介窓口)のID。未割り当ての場合はnull */
  contact_member_id: string | null;
  status: ReferralRequestStatus;
  created_at: string;
}

export interface ReferralRequestInput {
  category: string;
  power_team: string;
  description: string;
  contact_member_id: string | null;
  status: ReferralRequestStatus;
}

const DUMMY_STORAGE_KEY = "bni-dummy-referral-requests-v1";

function buildSeedRequests(): ReferralRequest[] {
  return [
    {
      id: "dummy-referral-1",
      category: "不動産",
      power_team: "建築・不動産パワーチーム",
      description:
        "事業用物件の売買・仲介ができるメンバーを探しています。チャプター内に不動産カテゴリが不足しています。",
      contact_member_id: "dummy-1",
      status: "open",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-referral-2",
      category: "弁護士",
      power_team: "士業パワーチーム",
      description: "契約書レビューや企業法務に強い弁護士を募集中。ビジター招待の優先ターゲットです。",
      contact_member_id: "dummy-2",
      status: "in_progress",
      created_at: new Date().toISOString(),
    },
    {
      id: "dummy-referral-3",
      category: "Web制作・デザイン",
      power_team: "広告・デザインパワーチーム",
      description: "コーポレートサイト制作ができるメンバーが加入し、充足しました。",
      contact_member_id: "dummy-4",
      status: "fulfilled",
      created_at: new Date().toISOString(),
    },
  ];
}

function loadDummyRequests(): ReferralRequest[] {
  if (typeof window === "undefined") return buildSeedRequests();
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedRequests();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as ReferralRequest[];
  } catch {
    const seeded = buildSeedRequests();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyRequests(requests: ReferralRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(requests));
}

function normalizeRequest(r: ReferralRequest): ReferralRequest {
  return {
    ...r,
    power_team: r.power_team ?? "",
    description: r.description ?? "",
    contact_member_id: r.contact_member_id ?? null,
    status: r.status ?? "open",
  };
}

export async function fetchReferralRequests(): Promise<ReferralRequest[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("referral_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as ReferralRequest[]).map(normalizeRequest);
  }
  return loadDummyRequests().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createReferralRequest(
  input: ReferralRequestInput
): Promise<ReferralRequest> {
  if (supabase) {
    const { data, error } = await supabase
      .from("referral_requests")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return normalizeRequest(data as ReferralRequest);
  }

  const request: ReferralRequest = {
    id: crypto.randomUUID(),
    ...input,
    created_at: new Date().toISOString(),
  };
  const requests = loadDummyRequests();
  requests.unshift(request);
  saveDummyRequests(requests);
  return request;
}

export async function updateReferralRequest(
  id: string,
  input: ReferralRequestInput
): Promise<ReferralRequest> {
  if (supabase) {
    const { data, error } = await supabase
      .from("referral_requests")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return normalizeRequest(data as ReferralRequest);
  }

  const requests = loadDummyRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("募集情報が見つかりません");
  requests[index] = { ...requests[index], ...input };
  saveDummyRequests(requests);
  return requests[index];
}

export async function deleteReferralRequest(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("referral_requests").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  saveDummyRequests(loadDummyRequests().filter((r) => r.id !== id));
}
