"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import {
  deleteReferralRequest,
  fetchReferralRequests,
  REFERRAL_STATUS_LABELS,
  type ReferralRequest,
  type ReferralRequestStatus,
} from "@/lib/referralRequests";
import { getCategoryColor } from "@/lib/categoryColors";
import { getErrorMessage } from "@/lib/errorMessage";
import ReferralRequestForm from "@/components/ReferralRequestForm";

type FilterKey = "all" | ReferralRequestStatus;

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "open", label: "募集中" },
  { value: "in_progress", label: "調整中" },
  { value: "fulfilled", label: "充足" },
];

const STATUS_STYLES: Record<ReferralRequestStatus, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const STATUS_CARD_ACCENT: Record<ReferralRequestStatus, string> = {
  open: "border-l-4 border-l-amber-400",
  in_progress: "border-l-4 border-l-sky-400",
  fulfilled: "border-l-4 border-l-emerald-400 opacity-80",
};

export default function ReferralsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [formState, setFormState] = useState<{ open: boolean; editing: ReferralRequest | null }>({
    open: false,
    editing: null,
  });

  useEffect(() => {
    Promise.all([fetchMembers(), fetchReferralRequests()])
      .then(([ms, rs]) => {
        setMembers(ms);
        setRequests(rs);
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter]
  );

  function handleSaved(r: ReferralRequest) {
    setRequests((prev) => {
      const exists = prev.some((x) => x.id === r.id);
      return exists ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev];
    });
    setFormState({ open: false, editing: null });
  }

  async function handleDelete(r: ReferralRequest) {
    if (!window.confirm(`「${r.category}」の募集を削除しますか?`)) return;
    try {
      await deleteReferralRequest(r.id);
      setRequests((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            パワーチーム別 専門リファーラル掲示板
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            チャプター内で不足しているカテゴリーを共有し、ビジター招待のターゲット選定に活用しましょう。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ open: true, editing: null })}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Plus size={14} />
          募集を追加
        </button>
      </div>

      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータで動作しています(ブラウザのlocalStorageに保存されます)。
        </p>
      )}

      <div className="mt-5 flex w-fit flex-wrap items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === opt.value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          該当する募集情報がありません。「募集を追加」から登録してください。
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const color = getCategoryColor(r.category);
            const contact = r.contact_member_id ? memberMap.get(r.contact_member_id) : undefined;
            return (
              <div
                key={r.id}
                className={`flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${STATUS_CARD_ACCENT[r.status]}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {r.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {REFERRAL_STATUS_LABELS[r.status]}
                  </span>
                </div>

                {r.power_team && (
                  <span className="w-fit rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {r.power_team}
                  </span>
                )}

                {r.description && (
                  <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {r.description}
                  </p>
                )}

                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Users size={12} />
                  紹介窓口: {contact?.name ?? "未設定"}
                </div>

                <div className="mt-2 flex items-center gap-1 self-end">
                  <button
                    type="button"
                    onClick={() => setFormState({ open: true, editing: r })}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={12} />
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    <Trash2 size={12} />
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formState.open && (
        <ReferralRequestForm
          initial={formState.editing}
          members={members}
          onSaved={handleSaved}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
