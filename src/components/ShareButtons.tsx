"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/** "/" で始まる相対パスの場合のみ、クリック時にorigin(ブラウザ側でのみ判明する)を付与して絶対URLにする */
function resolveUrl(url: string): string {
  if (typeof window !== "undefined" && url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

export default function ShareButtons({
  url,
  text,
  className,
}: {
  /** 共有するURL(絶対URL、または "/" 始まりの相対パス) */
  url: string;
  /** LINE共有時に添えるメッセージ(未指定ならURLのみ) */
  text?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleLineShare() {
    const resolved = resolveUrl(url);
    const shareText = text ? `${text} ${resolved}` : resolved;
    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resolveUrl(url));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボードAPIが使えない環境(非HTTPS等)では何もしない
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleLineShare}
        title="LINEで共有"
        className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
      >
        <MessageCircle size={12} />
        LINEで共有
      </button>
      <button
        type="button"
        onClick={handleCopy}
        title="URLをコピー"
        className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "コピーしました" : "URLをコピー"}
      </button>
    </div>
  );
}
