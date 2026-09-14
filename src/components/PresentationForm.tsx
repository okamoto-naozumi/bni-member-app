"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  createPresentation,
  updatePresentation,
  type Presentation,
  type PresentationInput,
} from "@/lib/presentations";
import type { Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";

export default function PresentationForm({
  initial,
  members,
  defaultDate,
  onSaved,
  onCancel,
}: {
  initial?: Presentation | null;
  members: Member[];
  defaultDate?: string;
  onSaved: (presentation: Presentation) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.presentation_date ?? defaultDate ?? "");
  const [memberId, setMemberId] = useState(initial?.member_id ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [materialUrl, setMaterialUrl] = useState(initial?.material_url ?? "");
  const [materialName, setMaterialName] = useState(initial?.material_name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;

    setSubmitting(true);
    setError(null);
    try {
      const input: PresentationInput = {
        presentation_date: date,
        member_id: memberId || null,
        theme,
        material_url: materialUrl.trim(),
        material_name: materialName.trim(),
      };

      const saved = initial
        ? await updatePresentation(initial.id, input)
        : await createPresentation(input);

      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
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
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {initial ? "プレゼン予定を編集" : "プレゼン予定を追加"}
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
            実施日<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            担当メンバー
          </span>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="input"
          >
            <option value="">未設定</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            プレゼンテーマ
          </span>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="input"
            placeholder="例: 事業紹介・強みのアピール"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            プレゼン資料URL(Googleドライブ等の共有URL)
          </span>
          <input
            type="url"
            value={materialUrl}
            onChange={(e) => setMaterialUrl(e.target.value)}
            className="input"
            placeholder="https://drive.google.com/..."
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            資料名(任意)
          </span>
          <input
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            className="input"
            placeholder="例: 事業紹介スライド"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
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
        </div>
      </form>
    </div>
  );
}
