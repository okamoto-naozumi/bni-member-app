"use client";

import { useState } from "react";
import { Link as LinkIcon, X } from "lucide-react";
import { createSharedTeam } from "@/lib/sharedTeams";
import { getErrorMessage } from "@/lib/errorMessage";
import CopyTextButton from "@/components/CopyTextButton";

export default function ShareTeamModal({
  memberIds,
  onClose,
  onCreated,
}: {
  memberIds: string[];
  onClose: () => void;
  /** 共有URLの発行に成功した時点で呼ばれる(選択状態のクリア等に使用) */
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const team = await createSharedTeam({ name: name.trim(), member_ids: memberIds });
      const url = `${window.location.origin}/team/${team.id}`;
      setShareUrl(url);
      onCreated?.();
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // クリップボードAPIが使えない環境では画面のコピーボタンで代替する
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            外部共有URLを作成
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        {shareUrl ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              共有URLを作成しました。クリップボードにコピー済みです。
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <LinkIcon size={14} className="shrink-0" />
              <span className="truncate">{shareUrl}</span>
            </div>
            <div className="flex gap-2">
              <CopyTextButton text={shareUrl} label="URLを再コピー" />
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              選択中の{memberIds.length}名を外部営業先へ紹介するための閲覧専用ページを作成します。
            </p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
                チーム名<span className="ml-0.5 text-red-500">*</span>
              </span>
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="例: 建築チーム"
              />
            </label>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
              >
                {submitting ? "作成中..." : "共有URLを作成"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
