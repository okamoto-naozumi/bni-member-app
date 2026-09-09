"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IdCard, MessageCircle, Camera, Users, QrCode } from "lucide-react";
import { fetchMemberById, type Member } from "@/lib/members";
import { generateQrDataUrl, memberProfileUrl } from "@/lib/qrcode";
import { getCategoryColor } from "@/lib/categoryColors";

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchMemberById(id).then(setMember);
  }, [id]);

  useEffect(() => {
    if (!member?.show_qr_code) return;
    generateQrDataUrl(memberProfileUrl(member.id)).then(setQrUrl);
  }, [member]);

  if (member === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">メンバーが見つかりませんでした。</p>
      </div>
    );
  }

  const color = getCategoryColor(member.category);
  const photo = member.photo_bust_url || member.photo_icon_url;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-10 sm:py-16">
      {/* eslint-disable-next-line @next/next/no-img-element -- photo may be a data URL or arbitrary remote host */}
      <img
        src={photo}
        alt={member.name}
        className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg dark:border-zinc-800"
      />

      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {member.name}
      </h1>
      {member.name_kana && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.name_kana}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {member.role && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {member.role}
          </span>
        )}
        {member.category && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {member.category}
          </span>
        )}
      </div>

      {(member.company || member.chapter) && (
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {[member.company, member.chapter].filter(Boolean).join(" / ")}
        </p>
      )}

      {member.comment && (
        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {member.comment}
        </p>
      )}

      <div className="mt-6 flex w-full flex-col gap-2.5">
        {member.digital_card_url && (
          <ProfileLinkButton
            href={member.digital_card_url}
            icon={<IdCard size={18} />}
            label="デジタル名刺を見る"
            className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          />
        )}
        {member.line_url && (
          <ProfileLinkButton
            href={member.line_url}
            icon={<MessageCircle size={18} />}
            label="LINEで友だち追加"
            className="bg-[#06C755] text-white hover:opacity-90"
          />
        )}
        {member.instagram_url && (
          <ProfileLinkButton
            href={member.instagram_url}
            icon={<Camera size={18} />}
            label="Instagramをフォロー"
            className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white hover:opacity-90"
          />
        )}
        {member.facebook_url && (
          <ProfileLinkButton
            href={member.facebook_url}
            icon={<Users size={18} />}
            label="Facebookでつながる"
            className="bg-[#1877F2] text-white hover:opacity-90"
          />
        )}
      </div>

      {member.show_qr_code && qrUrl && (
        <div className="mt-8 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code is a generated data URL */}
          <img src={qrUrl} alt="このページを開くQRコード" className="h-36 w-36" />
          <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <QrCode size={12} />
            このページを共有するQRコード
          </p>
        </div>
      )}
    </div>
  );
}

function ProfileLinkButton({
  href,
  icon,
  label,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-sm transition-opacity ${className}`}
    >
      {icon}
      {label}
    </a>
  );
}
