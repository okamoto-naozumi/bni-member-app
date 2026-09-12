"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  resolveEndTime,
  DEFAULT_EVENT_COLOR,
  type Event,
  type EventInput,
} from "@/lib/events";
import type { Category } from "@/lib/eventCategories";
import { getErrorMessage } from "@/lib/errorMessage";

const COLOR_PRESETS = [
  { value: "#3b82f6", label: "青" },
  { value: "#22c55e", label: "緑" },
  { value: "#f59e0b", label: "橙" },
  { value: "#ef4444", label: "赤" },
  { value: "#a855f7", label: "紫" },
  { value: "#6b7280", label: "灰" },
];

export default function EventForm({
  initial,
  categories,
  defaultStart,
  onSaved,
  onDeleted,
  onCancel,
}: {
  initial?: Event | null;
  categories: Category[];
  defaultStart?: string;
  onSaved: (event: Event) => void;
  onDeleted?: (event: Event) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startTime, setStartTime] = useState(initial?.start_time ?? defaultStart ?? "");
  const [endTime, setEndTime] = useState(initial?.end_time ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_EVENT_COLOR);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [zoomUrl, setZoomUrl] = useState(initial?.zoom_url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startTime) return;

    setSubmitting(true);
    setError(null);
    try {
      const input: EventInput = {
        title: title.trim(),
        start_time: startTime,
        end_time: resolveEndTime(startTime, endTime),
        category_id: categoryId || null,
        color,
        location: location.trim(),
        zoom_url: zoomUrl.trim(),
        description: description.trim(),
      };
      const saved = initial ? await updateEvent(initial.id, input) : await createEvent(input);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`「${initial.title}」を削除しますか?`)) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteEvent(initial.id);
      onDeleted?.(initial);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {initial ? "予定を編集" : "予定を追加"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            タイトル<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="例: 定例会"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              開始日時<span className="ml-0.5 text-red-500">*</span>
            </span>
            <input
              required
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
              終了日時
            </span>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
              placeholder="未入力なら開始日時と同じ"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            カテゴリ
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="">未分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            背景色
          </span>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                className={`h-6 w-6 shrink-0 rounded-full ring-offset-2 ring-offset-white transition-shadow dark:ring-offset-zinc-950 ${
                  color === c.value ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""
                }`}
                style={{ backgroundColor: c.value }}
                aria-label={c.label}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-6 w-8 shrink-0 cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-700"
              aria-label="背景色をカスタム指定"
            />
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            場所
          </span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder="例: 本部会議室"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            Zoomリンク
          </span>
          <input
            type="url"
            value={zoomUrl}
            onChange={(e) => setZoomUrl(e.target.value)}
            className="input"
            placeholder="https://zoom.us/j/..."
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            詳細
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-20 resize-y"
            placeholder="予定の詳細を記入してください"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            {submitting ? "保存中..." : initial ? "更新する" : "登録する"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            キャンセル
          </button>
          {initial && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="ml-auto flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <Trash2 size={12} />
              削除
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
