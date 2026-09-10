"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  createLibraryLink,
  updateLibraryLink,
  LIBRARY_CATEGORY_SUGGESTIONS,
  type LibraryLink,
  type LibraryLinkInput,
} from "@/lib/libraryLinks";
import { getErrorMessage } from "@/lib/errorMessage";

export default function LibraryLinkForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: LibraryLink | null;
  onSaved: (link: LibraryLink) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const input: LibraryLinkInput = {
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        category: category.trim(),
      };
      const saved = initial
        ? await updateLibraryLink(initial.id, input)
        : await createLibraryLink(input);
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
            {initial ? "資料を編集" : "資料を追加"}
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
            placeholder="例: 定例会 進行シナリオ テンプレート"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            共有URL(Googleドライブ等)<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input"
            placeholder="https://drive.google.com/..."
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            カテゴリ
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="例: 定例会資料"
            list="library-category-suggestions"
          />
          <datalist id="library-category-suggestions">
            {LIBRARY_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            説明文
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-20 resize-y"
            placeholder="どのような資料か、いつ使うものかを記入してください"
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
