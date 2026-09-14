"use client";

import { useMemo, useState } from "react";
import { Mail, MessageCircle, Share2, Sparkles } from "lucide-react";
import {
  generateInviteTexts,
  type InviteGeneratorInput,
} from "@/lib/inviteGenerator";
import CopyTextButton from "@/components/CopyTextButton";

const EMPTY_INPUT: InviteGeneratorInput = {
  chapterName: "",
  meetingDate: "",
  meetingTime: "07:00",
  venue: "",
  inviterName: "",
  visitorName: "",
};

export default function VisitorGeneratorPage() {
  const [input, setInput] = useState<InviteGeneratorInput>(EMPTY_INPUT);

  const texts = useMemo(() => generateInviteTexts(input), [input]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        <Sparkles size={20} />
        ビジター招待文・お礼状ジェネレーター
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        定例会の情報を入力すると、LINE・メール・SNS用の招待文と、参加後のお礼状を自動生成します。各カードの「コピー」ボタンでそのまま貼り付けできます。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
        <Field label="チャプター名">
          <input
            value={input.chapterName}
            onChange={(e) => setInput({ ...input, chapterName: e.target.value })}
            className="input"
            placeholder="BNI ENISHIチャプター"
          />
        </Field>
        <Field label="会場">
          <input
            value={input.venue}
            onChange={(e) => setInput({ ...input, venue: e.target.value })}
            className="input"
            placeholder="例: ○○ホテル 2階会議室"
          />
        </Field>
        <Field label="開催日">
          <input
            type="date"
            value={input.meetingDate}
            onChange={(e) => setInput({ ...input, meetingDate: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="開始時間">
          <input
            type="time"
            value={input.meetingTime}
            onChange={(e) => setInput({ ...input, meetingTime: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="紹介者(あなたの名前)">
          <input
            value={input.inviterName}
            onChange={(e) => setInput({ ...input, inviterName: e.target.value })}
            className="input"
            placeholder="例: 山田太郎"
          />
        </Field>
        <Field label="ビジター名(任意)">
          <input
            value={input.visitorName}
            onChange={(e) => setInput({ ...input, visitorName: e.target.value })}
            className="input"
            placeholder="例: 鈴木様(未入力でも生成できます)"
          />
        </Field>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GeneratedCard
          icon={<MessageCircle size={16} className="text-emerald-600" />}
          title="LINE用 招待文"
          text={texts.line}
        />
        <GeneratedCard
          icon={<Mail size={16} className="text-sky-600" />}
          title="メール用 招待文"
          text={texts.email}
        />
        <GeneratedCard
          icon={<Share2 size={16} className="text-indigo-600" />}
          title="SNS用 投稿文"
          text={texts.sns}
        />
        <GeneratedCard
          icon={<Sparkles size={16} className="text-amber-600" />}
          title="参加後のお礼状"
          text={texts.thankYou}
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function GeneratedCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {icon}
          {title}
        </span>
        <CopyTextButton text={text} label="コピー" />
      </div>
      <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {text}
      </p>
    </div>
  );
}
