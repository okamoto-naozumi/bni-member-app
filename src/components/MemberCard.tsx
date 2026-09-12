import Link from "next/link";
import { Info, Pencil, Trash2 } from "lucide-react";
import type { Member } from "@/lib/members";
import ShareButtons from "@/components/ShareButtons";

export default function MemberCard({
  member,
  qrCodeUrl,
  onDetail,
  onEdit,
  onDelete,
}: {
  member: Member;
  /** メンバーの名刺ページ(/m/[id])へ遷移するQRコードのdata URL。show_qr_codeがtrueの間だけ表示に使用する。 */
  qrCodeUrl?: string | null;
  onDetail?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- photo_icon_url may be a data URL or arbitrary remote host */}
        <img
          src={member.photo_icon_url}
          alt={member.name}
          className="h-16 w-16 rounded-full object-cover"
        />
        {member.show_qr_code && (
          <Link
            href={`/m/${member.id}`}
            target="_blank"
            title="このQRコードをスキャンするとデジタル名刺が開きます"
            className="block"
          >
            {qrCodeUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- QR code is a generated data URL */
              <img
                src={qrCodeUrl}
                alt={`${member.name}のデジタル名刺QRコード`}
                className="h-20 w-20 rounded-md border border-zinc-200 bg-white p-1 dark:border-zinc-800"
              />
            ) : (
              <div className="h-20 w-20 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
            )}
          </Link>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                {member.name}
              </h3>
              {member.name_kana && (
                <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {member.name_kana}
                </span>
              )}
            </div>
            {(member.chapter || member.role) && (
              <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                {[member.chapter, member.role].filter(Boolean).join(" / ")}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onDetail && (
              <button
                type="button"
                onClick={onDetail}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Info size={12} />
                詳細
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Pencil size={12} />
                編集
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Trash2 size={12} />
                削除
              </button>
            )}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
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
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {member.company}
            </span>
          )}
        </div>

        {member.wanted_referral && (
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">
              欲しいリファーラル:
            </span>{" "}
            {member.wanted_referral}
          </p>
        )}

        {member.comment && (
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {member.comment}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {member.contact && <span>{member.contact}</span>}
          {member.email && <span>{member.email}</span>}
          {member.hp_url && (
            <a
              href={member.hp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sky-600 underline dark:text-sky-400"
            >
              {member.hp_url}
            </a>
          )}
        </div>

        {member.custom_fields.length > 0 && (
          <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {member.custom_fields.map((field, i) => (
              <div key={i} className="flex gap-1">
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  {field.key}:
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-2">
          <ShareButtons url={`/m/${member.id}`} text={`${member.name}さんのデジタル名刺`} />
        </div>
      </div>
    </div>
  );
}
