"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchMembers, type Member } from "@/lib/members";
import {
  deletePresentation,
  fetchPresentations,
  daysUntil,
  type Presentation,
} from "@/lib/presentations";
import { getErrorMessage } from "@/lib/errorMessage";
import PresentationForm from "@/components/PresentationForm";
import PresenterReminderBanner from "@/components/PresenterReminderBanner";

type ViewMode = "list" | "calendar";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function PresentersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [formState, setFormState] = useState<{
    open: boolean;
    editing: Presentation | null;
    defaultDate?: string;
  }>({ open: false, editing: null });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    // メンバー取得とプレゼン予定取得は独立して行う。
    // 片方が失敗しても、もう片方の結果(特に担当メンバーの選択肢)は失われないようにする。
    Promise.allSettled([fetchMembers(), fetchPresentations()]).then(
      ([membersResult, presentationsResult]) => {
        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value);
        } else {
          setLoadError(getErrorMessage(membersResult.reason));
        }
        if (presentationsResult.status === "fulfilled") {
          setPresentations(presentationsResult.value);
        } else {
          setLoadError((prev) => prev ?? getErrorMessage(presentationsResult.reason));
        }
        setLoading(false);
      }
    );
  }, []);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  function handleSaved(p: Presentation) {
    setPresentations((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      const next = exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      return next.sort((a, b) => a.presentation_date.localeCompare(b.presentation_date));
    });
    setFormState({ open: false, editing: null });
  }

  async function handleDelete(p: Presentation) {
    if (!window.confirm(`${formatDateLabel(p.presentation_date)} のプレゼン予定を削除しますか?`))
      return;
    try {
      await deletePresentation(p.id);
      setPresentations((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  const sorted = useMemo(
    () =>
      [...presentations].sort((a, b) => a.presentation_date.localeCompare(b.presentation_date)),
    [presentations]
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sorted.filter((p) => p.presentation_date >= today);
  const past = sorted.filter((p) => p.presentation_date < today).reverse();

  const { year, month } = calendarMonth;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${mm}-${dd}`;
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const presentationsByDate = useMemo(() => {
    const map = new Map<string, Presentation[]>();
    for (const p of presentations) {
      const arr = map.get(p.presentation_date) ?? [];
      arr.push(p);
      map.set(p.presentation_date, arr);
    }
    return map;
  }, [presentations]);

  function goMonth(delta: number) {
    setCalendarMonth(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function openCreate(defaultDate?: string) {
    setFormState({ open: true, editing: null, defaultDate });
  }
  function openEdit(p: Presentation) {
    setFormState({ open: true, editing: p });
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          メインプレゼンター管理
        </h1>
        <button
          type="button"
          onClick={() => openCreate()}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
        >
          <Plus size={14} />
          プレゼン予定を追加
        </button>
      </div>

      <div className="mt-4">
        <PresenterReminderBanner />
      </div>

      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータで動作しています(ブラウザのlocalStorageに保存されます)。
        </p>
      )}

      <div className="mt-5 flex w-fit items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          リスト
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            view === "calendar"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          カレンダー
        </button>
      </div>

      {loadError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{loadError}</p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : view === "list" ? (
        <div className="mt-4 flex flex-col gap-6">
          <PresentationSection
            title={`今後の予定(${upcoming.length}件)`}
            items={upcoming}
            memberMap={memberMap}
            onEdit={openEdit}
            onDelete={handleDelete}
            emptyLabel="今後の予定はまだありません。"
          />
          {past.length > 0 && (
            <PresentationSection
              title={`過去の実績(${past.length}件)`}
              items={past}
              memberMap={memberMap}
              onEdit={openEdit}
              onDelete={handleDelete}
              muted
            />
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="前の月"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {year}年{month + 1}月
            </span>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="次の月"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} className="aspect-square" />;
              const items = presentationsByDate.get(dateStr) ?? [];
              const isToday = dateStr === today;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => (items[0] ? openEdit(items[0]) : openCreate(dateStr))}
                  className={`flex aspect-square flex-col items-start gap-0.5 overflow-hidden rounded-lg border p-1.5 text-left text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                    isToday
                      ? "border-zinc-900 dark:border-zinc-100"
                      : "border-zinc-100 dark:border-zinc-900"
                  }`}
                >
                  <span
                    className={`font-medium ${
                      isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"
                    }`}
                  >
                    {Number(dateStr.slice(-2))}
                  </span>
                  {items.map((p) => (
                    <span
                      key={p.id}
                      className="w-full truncate rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    >
                      {memberMap.get(p.member_id ?? "")?.name ?? "未設定"}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {formState.open && (
        <PresentationForm
          initial={formState.editing}
          members={members}
          defaultDate={formState.defaultDate}
          onSaved={handleSaved}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

function PresentationSection({
  title,
  items,
  memberMap,
  onEdit,
  onDelete,
  emptyLabel,
  muted,
}: {
  title: string;
  items: Presentation[];
  memberMap: Map<string, Member>;
  onEdit: (p: Presentation) => void;
  onDelete: (p: Presentation) => void;
  emptyLabel?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((p) => {
            const member = p.member_id ? memberMap.get(p.member_id) : undefined;
            const days = daysUntil(p.presentation_date);
            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${
                  muted ? "opacity-70" : ""
                }`}
              >
                {member?.photo_icon_url && (
                  /* eslint-disable-next-line @next/next/no-img-element -- photo_icon_url may be a data URL or arbitrary remote host */
                  <img
                    src={member.photo_icon_url}
                    alt={member.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatDateLabel(p.presentation_date)}
                    </span>
                    {!muted && days >= 0 && days <= 14 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {days === 0 ? "本日" : `あと${days}日`}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    担当: {member?.name ?? "未設定"}
                    {p.theme ? ` / ${p.theme}` : ""}
                  </p>
                </div>
                {p.material_url && (
                  <a
                    href={p.material_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-950/50"
                  >
                    <FileText size={12} />
                    資料
                  </a>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Pencil size={12} />
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
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
    </div>
  );
}
