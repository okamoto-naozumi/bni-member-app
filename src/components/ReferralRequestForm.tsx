"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  createReferralRequest,
  updateReferralRequest,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUS_OPTIONS,
  type ReferralRequest,
  type ReferralRequestInput,
} from "@/lib/referralRequests";
import { MEMBER_CATEGORIES } from "@/lib/categories";
import { POWER_TEAM_SUGGESTIONS } from "@/lib/powerTeams";
import type { Member } from "@/lib/members";
import { getErrorMessage } from "@/lib/errorMessage";

export default function ReferralRequestForm({
  initial,
  members,
  onSaved,
  onCancel,
}: {
  initial?: ReferralRequest | null;
  members: Member[];
  onSaved: (request: ReferralRequest) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [powerTeam, setPowerTeam] = useState(initial?.power_team ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contactMemberId, setContactMemberId] = useState(initial?.contact_member_id ?? "");
  const [status, setStatus] = useState(initial?.status ?? "open");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const input: ReferralRequestInput = {
        category: category.trim(),
        power_team: powerTeam.trim(),
        description: description.trim(),
        contact_member_id: contactMemberId || null,
        status,
      };
      const saved = initial
        ? await updateReferralRequest(initial.id, input)
        : await createReferralRequest(input);
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
            {initial ? "募集情報を編集" : "リファーラル募集を追加"}
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
            募集カテゴリ<span className="ml-0.5 text-red-500">*</span>
          </span>
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="例: 不動産、弁護士"
            list="referral-category-suggestions"
          />
          <datalist id="referral-category-suggestions">
            {MEMBER_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            対象パワーチーム
          </span>
          <input
            value={powerTeam}
            onChange={(e) => setPowerTeam(e.target.value)}
            className="input"
            placeholder="例: 士業パワーチーム"
            list="power-team-suggestions"
          />
          <datalist id="power-team-suggestions">
            {POWER_TEAM_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            詳細説明
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-20 resize-y"
            placeholder="どのような業種・強みを持つメンバーを探しているか"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
            担当メンバー(紹介窓口)
          </span>
          <select
            value={contactMemberId}
            onChange={(e) => setContactMemberId(e.target.value)}
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
            ステータス
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReferralRequestInput["status"])}
            className="input"
          >
            {REFERRAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {REFERRAL_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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
