"use client";

import { X, Mail, Phone, Globe, Award, FileText } from "lucide-react";
import type { Member } from "@/lib/members";

export default function MemberDetailModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            メンバー詳細
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- photo_icon_url may be a data URL or arbitrary remote host */}
          <img
            src={member.photo_icon_url}
            alt={member.name}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {member.name}
              </h3>
              {member.name_kana && (
                <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {member.name_kana}
                </span>
              )}
            </div>
            {(member.chapter || member.role) && (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {[member.chapter, member.role].filter(Boolean).join(" / ")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {member.category && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {member.category}
            </span>
          )}
          {member.team && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {member.team}
            </span>
          )}
          {member.company && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{member.company}</span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          {member.contact && (
            <DetailRow icon={<Phone size={14} />} label="連絡先">
              {member.contact}
            </DetailRow>
          )}
          {member.email && (
            <DetailRow icon={<Mail size={14} />} label="メールアドレス">
              {member.email}
            </DetailRow>
          )}
          {member.hp_url && (
            <DetailRow icon={<Globe size={14} />} label="HP">
              <a
                href={member.hp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sky-600 underline dark:text-sky-400"
              >
                {member.hp_url}
              </a>
            </DetailRow>
          )}
        </dl>

        {member.wanted_referral && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              欲しいリファーラル
            </p>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {member.wanted_referral}
            </p>
          </div>
        )}

        {(member.gold_referral || member.silver_referral || member.bronze_referral) && (
          <div className="mt-4 flex flex-col gap-2">
            {member.gold_referral && (
              <ReferralBadge tier="gold" label="金のリファーラル" value={member.gold_referral} />
            )}
            {member.silver_referral && (
              <ReferralBadge
                tier="silver"
                label="銀のリファーラル"
                value={member.silver_referral}
              />
            )}
            {member.bronze_referral && (
              <ReferralBadge
                tier="bronze"
                label="銅のリファーラル"
                value={member.bronze_referral}
              />
            )}
          </div>
        )}

        {member.comment && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">コメント</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {member.comment}
            </p>
          </div>
        )}

        {member.attachment_url && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              資料・添付ファイル
            </p>
            <a
              href={member.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
            >
              <FileText size={16} />
              添付資料を開く
              {member.attachment_name && (
                <span className="truncate text-xs opacity-70">({member.attachment_name})</span>
              )}
            </a>
          </div>
        )}

        {member.custom_fields.length > 0 && (
          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            {member.custom_fields.map((field, i) => (
              <div key={i} className="flex gap-1">
                <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                  {field.key}:
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

const REFERRAL_TIER_STYLES = {
  gold: {
    wrapper:
      "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-yellow-950/20",
    badge: "bg-amber-400 text-amber-950",
    label: "text-amber-800 dark:text-amber-300",
  },
  silver: {
    wrapper:
      "border-zinc-300 bg-gradient-to-r from-zinc-50 to-slate-50 dark:border-zinc-600/50 dark:from-zinc-800/40 dark:to-slate-900/20",
    badge: "bg-zinc-300 text-zinc-800",
    label: "text-zinc-700 dark:text-zinc-300",
  },
  bronze: {
    wrapper:
      "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-800/50 dark:from-orange-950/30 dark:to-amber-950/10",
    badge: "bg-orange-400 text-orange-950",
    label: "text-orange-800 dark:text-orange-300",
  },
} as const;

function ReferralBadge({
  tier,
  label,
  value,
}: {
  tier: keyof typeof REFERRAL_TIER_STYLES;
  label: string;
  value: string;
}) {
  const style = REFERRAL_TIER_STYLES[tier];
  return (
    <div className={`rounded-lg border p-3 ${style.wrapper}`}>
      <div className="flex items-center gap-1.5">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full ${style.badge}`}
        >
          <Award size={12} />
        </span>
        <span className={`text-xs font-semibold ${style.label}`}>{label}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-zinc-400">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd className="truncate text-zinc-800 dark:text-zinc-200">{children}</dd>
      </div>
    </div>
  );
}
