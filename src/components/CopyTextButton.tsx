"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyTextButton({
  text,
  label = "コピー",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボードAPIが使えない環境(非HTTPS等)では何もしない
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        "flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
      }
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "コピーしました" : label}
    </button>
  );
}
