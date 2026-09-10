"use client";

import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";
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
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialUrl, setMaterialUrl] = useState(initial?.material_url ?? "");
  const [materialName, setMaterialName] = useState(initial?.material_name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function removeMaterial() {
    setMaterialFile(null);
    setMaterialUrl("");
    setMaterialName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
      };
      const shouldRemoveMaterial =
        !materialFile && !materialUrl && Boolean(initial?.material_url);

      const saved = initial
        ? await updatePresentation(
            initial.id,
            input,
            { file: materialFile, removeMaterial: shouldRemoveMaterial },
            { material_url: initial.material_url, material_name: initial.material_name }
          )
        : await createPresentation(input, { file: materialFile });

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

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            プレゼン資料(PDF/PPT等)
          </span>
          {materialUrl && !materialFile ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="shrink-0 text-zinc-400" />
              <a
                href={materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sky-600 underline dark:text-sky-400"
              >
                {materialName || "登録済みの資料を開く"}
              </a>
              <button
                type="button"
                onClick={removeMaterial}
                className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                aria-label="添付資料を削除"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx,image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) {
                  setMaterialFile(file);
                  setMaterialName(file.name);
                }
              }}
              className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-black"
            />
          )}
        </div>

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
