"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import {
  createPortfolio,
  updatePortfolio,
  PORTFOLIO_CATEGORY_SUGGESTIONS,
  type Portfolio,
  type PortfolioInput,
} from "@/lib/portfolios";
import type { Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";

export default function PortfolioForm({
  initial,
  members,
  onSaved,
  onCancel,
}: {
  initial?: Portfolio | null;
  members: Member[];
  onSaved: (portfolio: Portfolio) => void;
  onCancel: () => void;
}) {
  const [memberId, setMemberId] = useState(initial?.member_id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(file: File | null) {
    if (!file) return;
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const input: PortfolioInput = {
        member_id: memberId || null,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
      };
      const shouldRemoveImage = !imageFile && !imagePreview && Boolean(initial?.image_url);

      const saved = initial
        ? await updatePortfolio(
            initial.id,
            input,
            { file: imageFile, removeImage: shouldRemoveImage },
            initial.image_url
          )
        : await createPortfolio(input, { file: imageFile });

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
            {initial ? "ポートフォリオを編集" : "ポートフォリオを追加"}
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

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            写真
          </span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview may be a blob/data URL or arbitrary remote host
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1 text-xs">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-black"
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-1 text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  写真を削除
                </button>
              )}
            </div>
          </div>
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
            placeholder="例: オーダーメイド収納棚の施工事例"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            メンバー
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
            カテゴリ
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="例: 施工事例"
            list="portfolio-category-suggestions"
          />
          <datalist id="portfolio-category-suggestions">
            {PORTFOLIO_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            解説
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-20 resize-y"
            placeholder="商品・事例の内容やアピールポイントを記入してください"
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
