"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Paperclip, Plus, Settings, X } from "lucide-react";
import {
  createMember,
  updateMember,
  type CustomField,
  type Member,
  type MemberInput,
} from "@/lib/members";
import { MEMBER_CATEGORIES } from "@/lib/categories";
import { fetchTeams, type Team } from "@/lib/teams";
import { getErrorMessage } from "@/lib/errorMessage";
import PhotoCropModal from "@/components/PhotoCropModal";

const ROLE_SUGGESTIONS = [
  "プレジデント",
  "ヴァイスプレジデント",
  "書記兼会計",
  "イベントコーディネーター",
  "メンバー",
];

const EMPTY_INPUT: MemberInput = {
  chapter: "",
  role: "",
  name: "",
  name_kana: "",
  company: "",
  category: "",
  team: "",
  wanted_referral: "",
  gold_referral: "",
  silver_referral: "",
  bronze_referral: "",
  comment: "",
  contact: "",
  email: "",
  hp_url: "",
  custom_fields: [],
  digital_card_url: "",
  line_url: "",
  instagram_url: "",
  facebook_url: "",
  show_qr_code: false,
  one_to_one_sheet_url: "",
  bio_past_occupation: "",
  bio_spouse: "",
  bio_family: "",
  bio_pet: "",
  bio_hobby: "",
  bio_other_interests: "",
  bio_hometown: "",
  bio_residence: "",
  bio_residence_years: "",
  bio_strong_desire: "",
  bio_unknown_fact: "",
  bio_success_key: "",
  gains_goals: "",
  gains_accomplishments: "",
  gains_interests: "",
  gains_networks: "",
  gains_skills: "",
};

const FORM_TABS = [
  { key: "basic", label: "基本情報" },
  { key: "bio", label: "メンバー略歴" },
  { key: "gains", label: "G.A.I.N.S." },
] as const;
type FormTab = (typeof FORM_TABS)[number]["key"];

type BioFieldKey =
  | "bio_past_occupation"
  | "bio_spouse"
  | "bio_family"
  | "bio_pet"
  | "bio_hobby"
  | "bio_other_interests"
  | "bio_hometown"
  | "bio_residence"
  | "bio_residence_years"
  | "bio_strong_desire"
  | "bio_unknown_fact"
  | "bio_success_key";

type GainsFieldKey =
  | "gains_goals"
  | "gains_accomplishments"
  | "gains_interests"
  | "gains_networks"
  | "gains_skills";

const BIO_FIELDS: Array<{ key: BioFieldKey; label: string }> = [
  { key: "bio_past_occupation", label: "過去に経験した職業" },
  { key: "bio_spouse", label: "配偶者" },
  { key: "bio_family", label: "家族" },
  { key: "bio_pet", label: "ペット" },
  { key: "bio_hobby", label: "趣味" },
  { key: "bio_other_interests", label: "その他の関心事" },
  { key: "bio_hometown", label: "出身地" },
  { key: "bio_residence", label: "居住地" },
  { key: "bio_residence_years", label: "居住年数" },
  { key: "bio_strong_desire", label: "私の強い願望は" },
  { key: "bio_unknown_fact", label: "誰も知らない私" },
  { key: "bio_success_key", label: "私の成功の鍵は" },
];

const GAINS_FIELDS: Array<{ key: GainsFieldKey; label: string; sub: string }> = [
  { key: "gains_goals", label: "Goals", sub: "目標" },
  { key: "gains_accomplishments", label: "Accomplishments", sub: "実績" },
  { key: "gains_interests", label: "Interests", sub: "興味" },
  { key: "gains_networks", label: "Networks", sub: "人脈" },
  { key: "gains_skills", label: "Skills", sub: "スキル" },
];

type CropTarget = "icon" | "bust" | null;

export default function MemberForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Member | null;
  onSaved: (member: Member) => void;
  onCancel?: () => void;
}) {
  const [input, setInput] = useState<MemberInput>(() =>
    initial
      ? {
          chapter: initial.chapter,
          role: initial.role,
          name: initial.name,
          name_kana: initial.name_kana,
          company: initial.company,
          category: initial.category,
          team: initial.team,
          wanted_referral: initial.wanted_referral,
          gold_referral: initial.gold_referral,
          silver_referral: initial.silver_referral,
          bronze_referral: initial.bronze_referral,
          comment: initial.comment,
          contact: initial.contact,
          email: initial.email,
          hp_url: initial.hp_url,
          custom_fields: initial.custom_fields,
          digital_card_url: initial.digital_card_url,
          line_url: initial.line_url,
          instagram_url: initial.instagram_url,
          facebook_url: initial.facebook_url,
          show_qr_code: initial.show_qr_code,
          one_to_one_sheet_url: initial.one_to_one_sheet_url,
          bio_past_occupation: initial.bio_past_occupation,
          bio_spouse: initial.bio_spouse,
          bio_family: initial.bio_family,
          bio_pet: initial.bio_pet,
          bio_hobby: initial.bio_hobby,
          bio_other_interests: initial.bio_other_interests,
          bio_hometown: initial.bio_hometown,
          bio_residence: initial.bio_residence,
          bio_residence_years: initial.bio_residence_years,
          bio_strong_desire: initial.bio_strong_desire,
          bio_unknown_fact: initial.bio_unknown_fact,
          bio_success_key: initial.bio_success_key,
          gains_goals: initial.gains_goals,
          gains_accomplishments: initial.gains_accomplishments,
          gains_interests: initial.gains_interests,
          gains_networks: initial.gains_networks,
          gains_skills: initial.gains_skills,
        }
      : EMPTY_INPUT
  );
  const [formTab, setFormTab] = useState<FormTab>("basic");
  const [teams, setTeams] = useState<Team[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(
    initial?.photo_icon_url || null
  );
  const [bustFile, setBustFile] = useState<File | null>(null);
  const [bustPreview, setBustPreview] = useState<string | null>(
    initial?.photo_bust_url || null
  );
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string>(initial?.attachment_url || "");
  const [attachmentName, setAttachmentName] = useState<string>(initial?.attachment_name || "");
  const [oneToOneAttachmentFile, setOneToOneAttachmentFile] = useState<File | null>(null);
  const [oneToOneAttachmentUrl, setOneToOneAttachmentUrl] = useState<string>(
    initial?.one_to_one_attachment_url || ""
  );
  const [oneToOneAttachmentName, setOneToOneAttachmentName] = useState<string>(
    initial?.one_to_one_attachment_name || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bustInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const oneToOneAttachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeams().then(setTeams);
  }, []);

  function openCropFor(target: "icon" | "bust", file: File | null) {
    if (!file) return;
    setCropTarget(target);
    setCropSourceUrl(URL.createObjectURL(file));
  }

  function handleCropCancel() {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceUrl(null);
    setCropTarget(null);
    if (iconInputRef.current) iconInputRef.current.value = "";
    if (bustInputRef.current) bustInputRef.current.value = "";
  }

  function handleCropConfirm(blob: Blob) {
    const file = new File([blob], `${cropTarget}.png`, { type: "image/png" });
    const previewUrl = URL.createObjectURL(blob);

    if (cropTarget === "icon") {
      setIconFile(file);
      setIconPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });
    } else if (cropTarget === "bust") {
      setBustFile(file);
      setBustPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return previewUrl;
      });
    }

    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceUrl(null);
    setCropTarget(null);
    if (iconInputRef.current) iconInputRef.current.value = "";
    if (bustInputRef.current) bustInputRef.current.value = "";
  }

  function handleAttachmentSelect(file: File | null) {
    if (!file) return;
    setAttachmentFile(file);
    setAttachmentName(file.name);
  }

  function removeAttachment() {
    setAttachmentFile(null);
    setAttachmentUrl("");
    setAttachmentName("");
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  }

  function handleOneToOneAttachmentSelect(file: File | null) {
    if (!file) return;
    setOneToOneAttachmentFile(file);
    setOneToOneAttachmentName(file.name);
  }

  function removeOneToOneAttachment() {
    setOneToOneAttachmentFile(null);
    setOneToOneAttachmentUrl("");
    setOneToOneAttachmentName("");
    if (oneToOneAttachmentInputRef.current) oneToOneAttachmentInputRef.current.value = "";
  }

  function addCustomField() {
    setInput((prev) => ({
      ...prev,
      custom_fields: [...prev.custom_fields, { key: "", value: "" }],
    }));
  }

  function updateCustomField(index: number, patch: Partial<CustomField>) {
    setInput((prev) => ({
      ...prev,
      custom_fields: prev.custom_fields.map((f, i) =>
        i === index ? { ...f, ...patch } : f
      ),
    }));
  }

  function removeCustomField(index: number) {
    setInput((prev) => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: MemberInput = {
        ...input,
        custom_fields: input.custom_fields.filter(
          (f) => f.key.trim() || f.value.trim()
        ),
      };

      const shouldRemoveAttachment =
        !attachmentFile && !attachmentUrl && Boolean(initial?.attachment_url);
      const shouldRemoveOneToOneAttachment =
        !oneToOneAttachmentFile &&
        !oneToOneAttachmentUrl &&
        Boolean(initial?.one_to_one_attachment_url);

      const member = initial
        ? await updateMember(
            initial.id,
            payload,
            {
              iconFile,
              bustFile,
              attachmentFile,
              removeAttachment: shouldRemoveAttachment,
              oneToOneAttachmentFile,
              removeOneToOneAttachment: shouldRemoveOneToOneAttachment,
            },
            {
              photo_icon_url: initial.photo_icon_url,
              photo_bust_url: initial.photo_bust_url,
              attachment_url: initial.attachment_url,
              attachment_name: initial.attachment_name,
              one_to_one_attachment_url: initial.one_to_one_attachment_url,
              one_to_one_attachment_name: initial.one_to_one_attachment_name,
            }
          )
        : await createMember(payload, { iconFile, bustFile, attachmentFile, oneToOneAttachmentFile });

      onSaved(member);
      if (!initial) {
        setInput(EMPTY_INPUT);
        setIconFile(null);
        setIconPreview(null);
        setBustFile(null);
        setBustPreview(null);
        setAttachmentFile(null);
        setAttachmentUrl("");
        setAttachmentName("");
        if (attachmentInputRef.current) attachmentInputRef.current.value = "";
        setOneToOneAttachmentFile(null);
        setOneToOneAttachmentUrl("");
        setOneToOneAttachmentName("");
        if (oneToOneAttachmentInputRef.current) oneToOneAttachmentInputRef.current.value = "";
        setFormTab("basic");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex w-fit items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
          {FORM_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFormTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                formTab === t.key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={`flex flex-col gap-5 ${formTab === "basic" ? "" : "hidden"}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PhotoPicker
            label="パターン1: アイコン/グループ編成用"
            hint="円形または正方形にトリミングされます"
            preview={iconPreview}
            shapeClassName="rounded-full"
            inputRef={iconInputRef}
            onSelect={(file) => openCropFor("icon", file)}
          />
          <PhotoPicker
            label="パターン2: メンバーリストPDF用"
            hint="バストアップ写真(縦長)としてトリミングされます"
            preview={bustPreview}
            shapeClassName="rounded-md"
            aspectClassName="aspect-[3/4]"
            inputRef={bustInputRef}
            onSelect={(file) => openCropFor("bust", file)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="所属チャプター">
            <input
              value={input.chapter}
              onChange={(e) => setInput({ ...input, chapter: e.target.value })}
              className="input"
              placeholder="BNI ○○チャプター"
            />
          </Field>
          <Field label="役職">
            <input
              value={input.role}
              onChange={(e) => setInput({ ...input, role: e.target.value })}
              className="input"
              placeholder="例: プレジデント"
              list="role-suggestions"
            />
            <datalist id="role-suggestions">
              {ROLE_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
          <Field label="氏名" required>
            <input
              required
              value={input.name}
              onChange={(e) => setInput({ ...input, name: e.target.value })}
              className="input"
              placeholder="山田 太郎"
            />
          </Field>
          <Field label="フリガナ">
            <input
              value={input.name_kana}
              onChange={(e) => setInput({ ...input, name_kana: e.target.value })}
              className="input"
              placeholder="ヤマダ タロウ"
            />
          </Field>
          <Field label="会社名(事業名)">
            <input
              value={input.company}
              onChange={(e) => setInput({ ...input, company: e.target.value })}
              className="input"
              placeholder="株式会社サンプル"
            />
          </Field>
          <Field label="カテゴリ">
            <input
              value={input.category}
              onChange={(e) => setInput({ ...input, category: e.target.value })}
              className="input"
              placeholder="例: 税理士"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {MEMBER_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="チーム">
            <div className="flex items-center gap-2">
              <select
                value={input.team}
                onChange={(e) => setInput({ ...input, team: e.target.value })}
                className="input"
              >
                <option value="">未設定</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Link
                href="/settings/teams"
                title="チームを管理"
                className="shrink-0 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <Settings size={16} />
              </Link>
            </div>
          </Field>
          <Field label="連絡先(電話番号)">
            <input
              type="tel"
              value={input.contact}
              onChange={(e) => setInput({ ...input, contact: e.target.value })}
              className="input"
              placeholder="03-1234-5678"
            />
          </Field>
          <Field label="メールアドレス">
            <input
              type="email"
              value={input.email}
              onChange={(e) => setInput({ ...input, email: e.target.value })}
              className="input"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="HPリンク">
            <input
              type="url"
              value={input.hp_url}
              onChange={(e) => setInput({ ...input, hp_url: e.target.value })}
              className="input"
              placeholder="https://example.com"
            />
          </Field>
        </div>

        <Field label="欲しいリファーラル">
          <textarea
            value={input.wanted_referral}
            onChange={(e) => setInput({ ...input, wanted_referral: e.target.value })}
            className="input min-h-16 resize-y"
            placeholder="紹介してほしいお客様像を入力してください"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="金のリファーラル">
            <textarea
              value={input.gold_referral}
              onChange={(e) => setInput({ ...input, gold_referral: e.target.value })}
              className="input min-h-16 resize-y"
              placeholder="最も紹介してほしいお客様像"
            />
          </Field>
          <Field label="銀のリファーラル">
            <textarea
              value={input.silver_referral}
              onChange={(e) => setInput({ ...input, silver_referral: e.target.value })}
              className="input min-h-16 resize-y"
              placeholder="次に紹介してほしいお客様像"
            />
          </Field>
          <Field label="銅のリファーラル">
            <textarea
              value={input.bronze_referral}
              onChange={(e) => setInput({ ...input, bronze_referral: e.target.value })}
              className="input min-h-16 resize-y"
              placeholder="その他紹介してほしいお客様像"
            />
          </Field>
        </div>

        <Field label="紹介文">
          <textarea
            value={input.comment}
            onChange={(e) => setInput({ ...input, comment: e.target.value })}
            className="input min-h-20 resize-y"
            placeholder="事業内容やひとこと紹介文を入力してください"
          />
        </Field>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            資料・添付ファイル(PDF等)
          </span>
          {attachmentUrl && !attachmentFile ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="shrink-0 text-zinc-400" />
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sky-600 underline dark:text-sky-400"
              >
                {attachmentName || "登録済みの資料を開く"}
              </a>
              <button
                type="button"
                onClick={removeAttachment}
                className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                aria-label="添付ファイルを削除"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <input
                ref={attachmentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,application/pdf"
                onChange={(e) => handleAttachmentSelect(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-black"
              />
              {attachmentFile && (
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  aria-label="選択したファイルを取り消す"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
            <Paperclip size={12} />
            会社案内やサービス資料などのPDFファイル等をアップロードできます。
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <span className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            1to1シート
          </span>
          <p className="mb-2 text-xs text-zinc-500">
            1to1シートはPDF/画像ファイルの添付、または外部URL(Googleドライブ等)のどちらか一方、もしくは両方を登録できます。
          </p>

          {oneToOneAttachmentUrl && !oneToOneAttachmentFile ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} className="shrink-0 text-zinc-400" />
              <a
                href={oneToOneAttachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sky-600 underline dark:text-sky-400"
              >
                {oneToOneAttachmentName || "登録済みの1to1シートを開く"}
              </a>
              <button
                type="button"
                onClick={removeOneToOneAttachment}
                className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                aria-label="1to1シート添付ファイルを削除"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <input
                ref={oneToOneAttachmentInputRef}
                type="file"
                accept=".pdf,image/*,application/pdf"
                onChange={(e) => handleOneToOneAttachmentSelect(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-black"
              />
              {oneToOneAttachmentFile && (
                <button
                  type="button"
                  onClick={removeOneToOneAttachment}
                  className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  aria-label="選択したファイルを取り消す"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <Field label="1to1シートURL(Googleドライブ等)">
            <input
              type="url"
              value={input.one_to_one_sheet_url}
              onChange={(e) => setInput({ ...input, one_to_one_sheet_url: e.target.value })}
              className="input mt-2"
              placeholder="https://drive.google.com/..."
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              カスタム項目
            </span>
            <button
              type="button"
              onClick={addCustomField}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus size={12} />
              項目を追加
            </button>
          </div>
          {input.custom_fields.length === 0 ? (
            <p className="text-xs text-zinc-500">
              任意の項目名と内容を自由に追加できます(例: 得意分野 / 趣味 など)。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {input.custom_fields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={field.key}
                    onChange={(e) => updateCustomField(index, { key: e.target.value })}
                    className="input w-32 shrink-0"
                    placeholder="項目名"
                  />
                  <input
                    value={field.value}
                    onChange={(e) => updateCustomField(index, { value: e.target.value })}
                    className="input flex-1"
                    placeholder="内容"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                    aria-label="項目を削除"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              QRコード表示用
            </span>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">QRコードを表示する</span>
              <button
                type="button"
                role="switch"
                aria-checked={input.show_qr_code}
                onClick={() => setInput({ ...input, show_qr_code: !input.show_qr_code })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  input.show_qr_code ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    input.show_qr_code ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="デジタル名刺URL">
              <input
                type="url"
                value={input.digital_card_url}
                onChange={(e) => setInput({ ...input, digital_card_url: e.target.value })}
                className="input"
                placeholder="https://example.com/cards/your-name"
              />
            </Field>
            <Field label="LINE公式/個人URL">
              <input
                type="url"
                value={input.line_url}
                onChange={(e) => setInput({ ...input, line_url: e.target.value })}
                className="input"
                placeholder="https://line.me/ti/p/..."
              />
            </Field>
            <Field label="Instagram URL">
              <input
                type="url"
                value={input.instagram_url}
                onChange={(e) => setInput({ ...input, instagram_url: e.target.value })}
                className="input"
                placeholder="https://instagram.com/..."
              />
            </Field>
            <Field label="Facebook URL">
              <input
                type="url"
                value={input.facebook_url}
                onChange={(e) => setInput({ ...input, facebook_url: e.target.value })}
                className="input"
                placeholder="https://facebook.com/..."
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            QRコードは、これらのリンクをまとめたデジタル名刺ページ(/m/{"{id}"})を開くQRコードとして自動生成されます。
          </p>
        </div>
        </div>

        <div className={`flex flex-col gap-4 ${formTab === "bio" ? "" : "hidden"}`}>
          <p className="text-xs text-zinc-500">
            メンバー略歴シートに掲載する項目です。空欄のまま保存すると、その項目はシートに表示されません。
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BIO_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <input
                  value={input[f.key]}
                  onChange={(e) => setInput({ ...input, [f.key]: e.target.value })}
                  className="input"
                />
              </Field>
            ))}
          </div>
        </div>

        <div className={`flex flex-col gap-4 ${formTab === "gains" ? "" : "hidden"}`}>
          <p className="text-xs text-zinc-500">
            G.A.I.N.S.ワークシートに掲載する項目です。空欄のまま保存すると、その項目はシートに表示されません。
          </p>
          {GAINS_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label}(${f.sub})`}>
              <textarea
                value={input[f.key]}
                onChange={(e) => setInput({ ...input, [f.key]: e.target.value })}
                className="input min-h-16 resize-y"
              />
            </Field>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            {submitting ? "保存中..." : initial ? "更新する" : "メンバーを登録"}
          </button>
          {initial && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {cropTarget && cropSourceUrl && (
        <PhotoCropModal
          imageSrc={cropSourceUrl}
          title={cropTarget === "icon" ? "アイコン写真をトリミング" : "バストアップ写真をトリミング"}
          aspect={cropTarget === "icon" ? 1 : 3 / 4}
          allowShapeToggle={cropTarget === "icon"}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function PhotoPicker({
  label,
  hint,
  preview,
  shapeClassName,
  aspectClassName,
  inputRef,
  onSelect,
}: {
  label: string;
  hint: string;
  preview: string | null;
  shapeClassName: string;
  aspectClassName?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | null) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div
          className={`w-16 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900 ${shapeClassName} ${
            aspectClassName ?? "aspect-square"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview may be a blob URL or data URL
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex-1 text-xs">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:file:bg-zinc-100 dark:file:text-black"
          />
          <p className="mt-1 text-zinc-500">{hint}</p>
        </div>
      </div>
    </div>
  );
}
