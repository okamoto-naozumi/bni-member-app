"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Upload,
  Video,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchCategories, type Category } from "@/lib/eventCategories";
import { fetchEvents, type Event } from "@/lib/events";
import { importEventsFromCsv, serializeEventsCsv } from "@/lib/eventsCsv";
import { getErrorMessage } from "@/lib/errorMessage";
import EventForm from "@/components/EventForm";

type ViewMode = "month" | "week" | "day";

const ALL_CATEGORY = "all";
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(dateTime: string): string {
  const time = dateTime.split("T")[1];
  return time ?? "";
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function CalendarPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("month");
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY);
  const [refDate, setRefDate] = useState(() => new Date());
  const [importing, setImporting] = useState(false);
  const [formState, setFormState] = useState<{
    open: boolean;
    editing: Event | null;
    defaultStart?: string;
  }>({ open: false, editing: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.allSettled([fetchCategories(), fetchEvents()]).then(
      ([categoriesResult, eventsResult]) => {
        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value);
        } else {
          setLoadError(getErrorMessage(categoriesResult.reason));
        }
        if (eventsResult.status === "fulfilled") {
          setEvents(eventsResult.value);
        } else {
          setLoadError((prev) => prev ?? getErrorMessage(eventsResult.reason));
        }
        setLoading(false);
      }
    );
  }

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredEvents = useMemo(
    () =>
      categoryFilter === ALL_CATEGORY
        ? events
        : events.filter((e) => e.category_id === categoryFilter),
    [events, categoryFilter]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of filteredEvents) {
      const key = e.start_time.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [filteredEvents]);

  const today = new Date();
  const todayKey = toDateKey(today);

  function handleSaved(event: Event) {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id);
      return exists ? prev.map((e) => (e.id === event.id ? event : e)) : [...prev, event];
    });
    setFormState({ open: false, editing: null });
  }

  function handleDeleted(event: Event) {
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    setFormState({ open: false, editing: null });
  }

  function openCreate(defaultDate?: Date) {
    const defaultStart = defaultDate
      ? `${toDateKey(defaultDate)}T09:00`
      : `${toDateKey(refDate)}T09:00`;
    setFormState({ open: true, editing: null, defaultStart });
  }

  function openEdit(event: Event) {
    setFormState({ open: true, editing: event });
  }

  function goToday() {
    setRefDate(new Date());
  }

  function goPeriod(delta: number) {
    setRefDate((prev) => {
      if (view === "month") {
        return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      }
      if (view === "week") {
        return addDays(prev, delta * 7);
      }
      return addDays(prev, delta);
    });
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setNotice(null);
    setLoadError(null);
    try {
      const text = await file.text();
      const result = await importEventsFromCsv(text, categories);
      loadAll();
      const parts = [`${result.imported}件の予定を取り込みました。`];
      if (result.createdCategories.length > 0) {
        parts.push(`新規カテゴリ: ${result.createdCategories.join("、")}`);
      }
      if (result.skipped > 0) {
        parts.push(`(${result.skipped}件はタイトルまたは開始日時が不足していたためスキップしました)`);
      }
      setNotice(parts.join(" "));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  function handleExport() {
    const csv = serializeEventsCsv(events, categories);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar-events-${toDateKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            <CalendarDays size={20} />
            カレンダー
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            チャプターの予定を月・週・日単位で確認・登録できます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImportChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Upload size={14} />
            {importing ? "取り込み中..." : "CSVインポート"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download size={14} />
            CSVエクスポート
          </button>
          <button
            type="button"
            onClick={() => openCreate()}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            <Plus size={14} />
            予定を追加
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Supabase未設定のため、ダミーデータで動作しています(ブラウザのlocalStorageに保存されます)。
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {notice}
        </p>
      )}
      {loadError && (
        <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {loadError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                view === v
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {v === "month" ? "月" : v === "week" ? "週" : "日"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goPeriod(-1)}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="前へ"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            今日
          </button>
          <button
            type="button"
            onClick={() => goPeriod(1)}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="次へ"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex w-fit flex-wrap items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setCategoryFilter(ALL_CATEGORY)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            categoryFilter === ALL_CATEGORY
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          すべて
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryFilter(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === c.id
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">読み込み中...</p>
      ) : view === "month" ? (
        <MonthView
          refDate={refDate}
          todayKey={todayKey}
          eventsByDate={eventsByDate}
          categoryMap={categoryMap}
          onSelectEvent={openEdit}
          onSelectDate={(date) => openCreate(date)}
        />
      ) : view === "week" ? (
        <WeekView
          refDate={refDate}
          todayKey={todayKey}
          eventsByDate={eventsByDate}
          categoryMap={categoryMap}
          onSelectEvent={openEdit}
          onSelectDate={(date) => openCreate(date)}
        />
      ) : (
        <DayView
          refDate={refDate}
          todayKey={todayKey}
          eventsByDate={eventsByDate}
          categoryMap={categoryMap}
          onSelectEvent={openEdit}
          onSelectDate={(date) => openCreate(date)}
        />
      )}

      {formState.open && (
        <EventForm
          initial={formState.editing}
          categories={categories}
          defaultStart={formState.defaultStart}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onCancel={() => setFormState({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

function EventChip({
  event,
  categoryMap,
  onClick,
}: {
  event: Event;
  categoryMap: Map<string, Category>;
  onClick: () => void;
}) {
  const category = event.category_id ? categoryMap.get(event.category_id) : undefined;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${formatTime(event.start_time)} ${event.title}${category ? ` (${category.name})` : ""}`}
      className="w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-white hover:opacity-90"
      style={{ backgroundColor: event.color }}
    >
      {formatTime(event.start_time) && <span className="mr-1 opacity-90">{formatTime(event.start_time)}</span>}
      {event.title}
    </button>
  );
}

function MonthView({
  refDate,
  todayKey,
  eventsByDate,
  categoryMap,
  onSelectEvent,
  onSelectDate,
}: {
  refDate: Date;
  todayKey: string;
  eventsByDate: Map<string, Event[]>;
  categoryMap: Map<string, Category>;
  onSelectEvent: (event: Event) => void;
  onSelectDate: (date: Date) => void;
}) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {year}年{month + 1}月
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="min-h-24" />;
          const key = toDateKey(date);
          const items = eventsByDate.get(key) ?? [];
          const isToday = key === todayKey;
          const visible = items.slice(0, 3);
          const overflow = items.length - visible.length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`flex min-h-24 flex-col items-stretch gap-0.5 overflow-hidden rounded-lg border p-1.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                isToday
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/60"
                  : "border-zinc-100 dark:border-zinc-900"
              }`}
            >
              <span
                className={`px-0.5 text-xs font-medium ${
                  isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"
                }`}
              >
                {date.getDate()}
              </span>
              {visible.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  categoryMap={categoryMap}
                  onClick={() => onSelectEvent(event)}
                />
              ))}
              {overflow > 0 && (
                <span className="px-1 text-[10px] text-zinc-400">+{overflow}件</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  refDate,
  todayKey,
  eventsByDate,
  categoryMap,
  onSelectEvent,
  onSelectDate,
}: {
  refDate: Date;
  todayKey: string;
  eventsByDate: Map<string, Event[]>;
  categoryMap: Map<string, Category>;
  onSelectEvent: (event: Event) => void;
  onSelectDate: (date: Date) => void;
}) {
  const start = startOfWeek(refDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((date) => {
        const key = toDateKey(date);
        const items = eventsByDate.get(key) ?? [];
        const isToday = key === todayKey;
        return (
          <div
            key={key}
            className={`flex min-h-40 flex-col gap-1.5 rounded-xl border bg-white p-2.5 dark:bg-zinc-950 ${
              isToday
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900/60"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectDate(date)}
              className="flex items-center justify-between text-left"
            >
              <span
                className={`text-xs font-semibold ${
                  isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {WEEKDAY_LABELS[date.getDay()]} {date.getDate()}
              </span>
            </button>
            <div className="flex flex-col gap-1">
              {items.length === 0 ? (
                <span className="text-[11px] text-zinc-300 dark:text-zinc-700">予定なし</span>
              ) : (
                items.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    categoryMap={categoryMap}
                    onClick={() => onSelectEvent(event)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({
  refDate,
  todayKey,
  eventsByDate,
  categoryMap,
  onSelectEvent,
  onSelectDate,
}: {
  refDate: Date;
  todayKey: string;
  eventsByDate: Map<string, Event[]>;
  categoryMap: Map<string, Category>;
  onSelectEvent: (event: Event) => void;
  onSelectDate: (date: Date) => void;
}) {
  const key = toDateKey(refDate);
  const items = eventsByDate.get(key) ?? [];
  const isToday = key === todayKey;

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h2
          className={`text-sm font-semibold ${
            isToday ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {formatDateLabel(refDate)}
        </h2>
        <button
          type="button"
          onClick={() => onSelectDate(refDate)}
          className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Plus size={12} />
          この日に追加
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">予定はありません。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((event) => {
            const category = event.category_id ? categoryMap.get(event.category_id) : undefined;
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event)}
                className="flex items-start gap-3 rounded-lg border border-zinc-100 p-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {event.title}
                    </span>
                    {category && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {category.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTime(event.start_time)}
                    {event.end_time !== event.start_time ? ` 〜 ${formatTime(event.end_time)}` : ""}
                  </p>
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <MapPin size={12} />
                      {event.location}
                    </p>
                  )}
                  {event.zoom_url && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
                      <Video size={12} />
                      {event.zoom_url}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
                      {event.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
