import { supabase } from "@/lib/supabase";
import { uploadMemberPhoto } from "@/lib/memberPhotos";
import { uploadMemberAttachment } from "@/lib/memberAttachments";

export interface CustomField {
  key: string;
  value: string;
}

export interface Member {
  id: string;
  chapter: string;
  /** 役職(例: プレジデント、ヴァイスプレジデント、書記兼会計、イベントコーディネーター、メンバー) */
  role: string;
  name: string;
  name_kana: string;
  company: string;
  category: string;
  team: string;
  wanted_referral: string;
  /** 金のリファーラル(最も重要なリファーラル) */
  gold_referral: string;
  /** 銀のリファーラル */
  silver_referral: string;
  /** 銅のリファーラル */
  bronze_referral: string;
  comment: string;
  contact: string;
  email: string;
  hp_url: string;
  /** パターン1: アイコン/グループ編成用(正方形クロップ、円形表示可) */
  photo_icon_url: string;
  /** パターン2: メンバーリストPDF掲載用のバストアップ写真 */
  photo_bust_url: string;
  custom_fields: CustomField[];
  /** 一覧の手動並べ替え順(昇順)。ドラッグ&ドロップで更新される。 */
  sort_order: number;
  /** デジタル名刺URL(外部の名刺サービス等へのリンク) */
  digital_card_url: string;
  line_url: string;
  instagram_url: string;
  facebook_url: string;
  /** ONの場合のみ、まとめページ(/m/[id])へのQRコードを表示する。デフォルトはOFF。 */
  show_qr_code: boolean;
  /** 添付資料(PDF等)の公開URL */
  attachment_url: string;
  /** 添付資料の元のファイル名(表示用) */
  attachment_name: string;
  created_at: string;
}

export interface MemberInput {
  chapter: string;
  role: string;
  name: string;
  name_kana: string;
  company: string;
  category: string;
  team: string;
  wanted_referral: string;
  gold_referral: string;
  silver_referral: string;
  bronze_referral: string;
  comment: string;
  contact: string;
  email: string;
  hp_url: string;
  custom_fields: CustomField[];
  digital_card_url: string;
  line_url: string;
  instagram_url: string;
  facebook_url: string;
  show_qr_code: boolean;
}

export interface MemberPhotoFiles {
  iconFile?: File | null;
  bustFile?: File | null;
  /** 資料・添付ファイル(PDF等) */
  attachmentFile?: File | null;
  /** trueの場合、新しいファイルの指定がなくても既存の添付資料を削除する */
  removeAttachment?: boolean;
}

// v5: フィールド構成変更(QRコード表示用リンク・表示切り替えを追加)に伴いキーを変更し、
// 旧スキーマのデータが混在してクラッシュしないようにする。
const DUMMY_STORAGE_KEY = "bni-dummy-members-v5";

/**
 * 名前から頭文字アバター(サンプル画像)を生成する。
 * Supabase未設定時や、写真未アップロード時のフォールバックに使用。
 */
export function sampleAvatarUrl(name: string): string {
  const palette = ["F87171", "FB923C", "FBBF24", "34D399", "38BDF8", "818CF8", "F472B6"];
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % palette.length;
  }
  const background = palette[Math.abs(hash) % palette.length];
  // format=png を明示しないとSVGが返り、@react-pdf/renderer(ラスタ画像のみ対応)で
  // PDF描画が壊れて写真以降の項目が丸ごと表示されなくなる
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${background}&color=ffffff&size=128&bold=true&format=png`;
}

const DUMMY_SEED_MEMBERS: Array<
  Omit<Member, "photo_icon_url" | "photo_bust_url" | "sort_order"> & { photoName: string }
> = [
  {
    id: "dummy-1",
    chapter: "BNI サンプルチャプター",
    role: "プレジデント",
    name: "佐藤 太郎",
    name_kana: "サトウ タロウ",
    category: "税理士",
    company: "佐藤税務会計事務所",
    team: "ビジター委員会",
    wanted_referral: "顧問契約を検討している中小企業の経営者",
    gold_referral: "相続税申告を控えている資産家",
    silver_referral: "法人成りを検討している個人事業主",
    bronze_referral: "記帳代行を依頼したい小規模事業者",
    comment: "中小企業の税務顧問・相続対策を専門としています。",
    contact: "03-1234-5601",
    email: "satoh@example.com",
    hp_url: "https://example.com/satoh-tax",
    custom_fields: [{ key: "得意分野", value: "相続税申告" }],
    digital_card_url: "https://example.com/cards/satoh-taro",
    line_url: "https://line.me/ti/p/example-satoh",
    instagram_url: "https://instagram.com/example_satoh",
    facebook_url: "",
    show_qr_code: true,
    attachment_url: "",
    attachment_name: "",
    created_at: "2026-01-10T09:00:00.000Z",
    photoName: "佐藤 太郎",
  },
  {
    id: "dummy-2",
    chapter: "BNI サンプルチャプター",
    role: "ヴァイスプレジデント",
    name: "鈴木 花子",
    name_kana: "スズキ ハナコ",
    category: "社会保険労務士",
    company: "鈴木社会保険労務士事務所",
    team: "エデュケーション委員会",
    wanted_referral: "就業規則の見直しを検討している企業",
    gold_referral: "助成金の申請を検討している企業",
    silver_referral: "採用強化を進めている企業",
    bronze_referral: "労務相談窓口を探している企業",
    comment: "労務相談・就業規則の整備を支援します。",
    contact: "03-1234-5602",
    email: "suzuki@example.com",
    hp_url: "https://example.com/suzuki-sr",
    custom_fields: [],
    digital_card_url: "",
    line_url: "",
    instagram_url: "",
    facebook_url: "",
    show_qr_code: false,
    attachment_url: "",
    attachment_name: "",
    created_at: "2026-01-12T09:00:00.000Z",
    photoName: "鈴木 花子",
  },
  {
    id: "dummy-3",
    chapter: "BNI サンプルチャプター",
    role: "書記兼会計",
    name: "高橋 健一",
    name_kana: "タカハシ ケンイチ",
    category: "IT・システム開発",
    company: "高橋システムズ株式会社",
    team: "PR委員会",
    wanted_referral: "業務システムの刷新を検討している企業",
    gold_referral: "基幹システムの刷新を検討している企業",
    silver_referral: "業務効率化ツールを探している企業",
    bronze_referral: "ホームページ制作を検討している事業者",
    comment: "業務システムの受託開発、DX支援を行っています。",
    contact: "03-1234-5603",
    email: "takahashi@example.com",
    hp_url: "https://example.com/takahashi-systems",
    custom_fields: [{ key: "対応技術", value: "React / AWS" }],
    digital_card_url: "https://example.com/cards/takahashi-kenichi",
    line_url: "",
    instagram_url: "",
    facebook_url: "https://facebook.com/example.takahashi",
    show_qr_code: true,
    attachment_url: "",
    attachment_name: "",
    created_at: "2026-01-15T09:00:00.000Z",
    photoName: "高橋 健一",
  },
  {
    id: "dummy-4",
    chapter: "BNI サンプルチャプター",
    role: "イベントコーディネーター",
    name: "田中 美咲",
    name_kana: "タナカ ミサキ",
    category: "Web制作・デザイン",
    company: "スタジオTANAKA",
    team: "メンバーシップ委員会",
    wanted_referral: "ブランディングを見直したい企業経営者",
    gold_referral: "ブランディングを刷新したい企業経営者",
    silver_referral: "ロゴ・名刺デザインを依頼したい事業者",
    bronze_referral: "SNS運用を強化したい事業者",
    comment: "コーポレートサイト・ブランディングデザインを手がけています。",
    contact: "03-1234-5604",
    email: "tanaka@example.com",
    hp_url: "https://example.com/studio-tanaka",
    custom_fields: [],
    digital_card_url: "",
    line_url: "",
    instagram_url: "https://instagram.com/example_tanaka",
    facebook_url: "",
    show_qr_code: false,
    attachment_url: "",
    attachment_name: "",
    created_at: "2026-01-18T09:00:00.000Z",
    photoName: "田中 美咲",
  },
  {
    id: "dummy-5",
    chapter: "BNI サンプルチャプター",
    role: "メンバー",
    name: "伊藤 大輔",
    name_kana: "イトウ ダイスケ",
    category: "保険代理店",
    company: "伊藤保険サービス",
    team: "ビジター委員会",
    wanted_referral: "法人保険の見直しを検討している経営者",
    gold_referral: "事業承継に伴う法人保険を検討している経営者",
    silver_referral: "福利厚生を充実させたい企業",
    bronze_referral: "個人の生命保険を見直したい方",
    comment: "法人向け損害保険・生命保険のコンサルティング。",
    contact: "03-1234-5605",
    email: "ito@example.com",
    hp_url: "https://example.com/ito-insurance",
    custom_fields: [],
    digital_card_url: "",
    line_url: "https://line.me/ti/p/example-ito",
    instagram_url: "",
    facebook_url: "",
    show_qr_code: false,
    attachment_url: "",
    attachment_name: "",
    created_at: "2026-01-20T09:00:00.000Z",
    photoName: "伊藤 大輔",
  },
  {
    id: "dummy-6",
    chapter: "BNI サンプルチャプター",
    role: "メンバー",
    name: "渡辺 由美",
    name_kana: "ワタナベ ユミ",
    category: "不動産",
    company: "渡辺不動産株式会社",
    team: "エデュケーション委員会",
    wanted_referral: "事業用物件を探している法人・個人事業主",
    gold_referral: "事業用物件の売買を検討している法人",
    silver_referral: "オフィス移転を検討している企業",
    bronze_referral: "資産活用の相談をしたい個人オーナー",
    comment: "事業用物件の仲介・資産活用のご相談を承ります。",
    contact: "03-1234-5606",
    email: "watanabe@example.com",
    hp_url: "https://example.com/watanabe-estate",
    custom_fields: [],
    digital_card_url: "",
    line_url: "",
    instagram_url: "",
    facebook_url: "",
    show_qr_code: false,
    attachment_url: "",
    attachment_name: "",
    created_at: "2026-01-22T09:00:00.000Z",
    photoName: "渡辺 由美",
  },
];

function buildSeedMembers(): Member[] {
  return DUMMY_SEED_MEMBERS.map(({ photoName, ...member }, index) => {
    const avatar = sampleAvatarUrl(photoName);
    return {
      ...member,
      photo_icon_url: avatar,
      photo_bust_url: avatar,
      sort_order: index,
    };
  });
}

/**
 * 過去バージョンで保存されたデータ(gold/silver/bronze_referral未対応)や、
 * DBのnull値を安全に補完する。既存データとの互換性維持のためのフォールバック。
 */
function normalizeMember(member: Member): Member {
  return {
    ...member,
    gold_referral: member.gold_referral ?? "",
    silver_referral: member.silver_referral ?? "",
    bronze_referral: member.bronze_referral ?? "",
    attachment_url: member.attachment_url ?? "",
    attachment_name: member.attachment_name ?? "",
  };
}

function loadDummyMembers(): Member[] {
  if (typeof window === "undefined") {
    return buildSeedMembers();
  }
  const raw = window.localStorage.getItem(DUMMY_STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedMembers();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return (JSON.parse(raw) as Member[]).map(normalizeMember);
  } catch {
    const seeded = buildSeedMembers();
    window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveDummyMembers(members: Member[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DUMMY_STORAGE_KEY, JSON.stringify(members));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * メンバー一覧を取得する。Supabase未設定時はダミーデータ(localStorage保存)を返す。
 */
export async function fetchMembers(): Promise<Member[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Member[]).map(normalizeMember);
  }
  return loadDummyMembers();
}

/**
 * IDを指定して1件取得する。デジタル名刺(まとめページ)用。
 */
export async function fetchMemberById(id: string): Promise<Member | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeMember(data as Member) : null;
  }
  const members = loadDummyMembers();
  return members.find((m) => m.id === id) ?? null;
}

async function resolvePhotoUrl(
  file: File | null | undefined,
  fallback: string,
  memberId: string,
  variant: "icon" | "bust"
): Promise<string> {
  if (!file) return fallback;
  if (supabase) return uploadMemberPhoto(file, memberId, variant);
  return fileToDataUrl(file);
}

async function resolveAttachment(
  file: File | null | undefined,
  removeAttachment: boolean | undefined,
  fallback: { attachment_url: string; attachment_name: string },
  memberId: string
): Promise<{ attachment_url: string; attachment_name: string }> {
  if (file) {
    const attachment_url = supabase
      ? await uploadMemberAttachment(file, memberId)
      : await fileToDataUrl(file);
    return { attachment_url, attachment_name: file.name };
  }
  if (removeAttachment) return { attachment_url: "", attachment_name: "" };
  return fallback;
}

/**
 * PostgrestErrorのメッセージから「存在しない列」の列名を抽出する。
 * gold_referral 等の新規カラムがまだ本番DBに追加されていない場合でも、
 * その列だけを除いて再送信できるようにするためのフォールバック。
 */
function extractMissingColumn(error: unknown): string | null {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  const patterns = [
    /Could not find the '([a-zA-Z0-9_]+)' column/i,
    /column "?([a-zA-Z0-9_]+)"? of relation "?members"? does not exist/i,
    /column members\.([a-zA-Z0-9_]+) does not exist/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * insert/update を実行し、DBにまだ存在しない列が原因でエラーになった場合は
 * その列を除いて自動的に再試行する。既存環境(未マイグレーション)との互換性を保つための処置。
 */
async function insertMemberSafely(
  payload: Record<string, unknown>
): Promise<Member> {
  const client = supabase;
  if (!client) throw new Error("Supabase is not configured");

  let attempt = payload;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await client.from("members").insert(attempt).select().single();
    if (!error) return data as Member;

    const missingColumn = extractMissingColumn(error);
    if (missingColumn && missingColumn in attempt) {
      const { [missingColumn]: _omit, ...rest } = attempt;
      attempt = rest;
      continue;
    }
    throw error;
  }
  throw new Error(
    "メンバーの登録に失敗しました。データベースのスキーマが最新ではない可能性があります。"
  );
}

async function updateMemberSafely(
  id: string,
  payload: Record<string, unknown>
): Promise<Member> {
  const client = supabase;
  if (!client) throw new Error("Supabase is not configured");

  let attempt = payload;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await client
      .from("members")
      .update(attempt)
      .eq("id", id)
      .select()
      .single();
    if (!error) return data as Member;

    const missingColumn = extractMissingColumn(error);
    if (missingColumn && missingColumn in attempt) {
      const { [missingColumn]: _omit, ...rest } = attempt;
      attempt = rest;
      continue;
    }
    throw error;
  }
  throw new Error(
    "メンバーの更新に失敗しました。データベースのスキーマが最新ではない可能性があります。"
  );
}

/**
 * メンバーを新規登録する。Supabase未設定時はダミーデータとしてlocalStorageに保存する。
 */
export async function createMember(
  input: MemberInput,
  photos: MemberPhotoFiles = {}
): Promise<Member> {
  const id = crypto.randomUUID();
  const fallbackAvatar = sampleAvatarUrl(input.name);
  const photo_icon_url = await resolvePhotoUrl(photos.iconFile, fallbackAvatar, id, "icon");
  const photo_bust_url = await resolvePhotoUrl(photos.bustFile, fallbackAvatar, id, "bust");
  const { attachment_url, attachment_name } = await resolveAttachment(
    photos.attachmentFile,
    photos.removeAttachment,
    { attachment_url: "", attachment_name: "" },
    id
  );

  if (supabase) {
    const data = await insertMemberSafely({
      id,
      ...input,
      photo_icon_url,
      photo_bust_url,
      attachment_url,
      attachment_name,
      sort_order: Date.now(),
    });
    return normalizeMember(data);
  }

  const member: Member = {
    id,
    ...input,
    photo_icon_url,
    photo_bust_url,
    attachment_url,
    attachment_name,
    sort_order: Date.now(),
    created_at: new Date().toISOString(),
  };

  const members = loadDummyMembers();
  members.unshift(member);
  saveDummyMembers(members);
  return member;
}

/**
 * 既存メンバーを更新する。写真ファイルが渡されない場合は既存のURLを維持する。
 */
export async function updateMember(
  id: string,
  input: MemberInput,
  photos: MemberPhotoFiles,
  existing: {
    photo_icon_url: string;
    photo_bust_url: string;
    attachment_url: string;
    attachment_name: string;
  }
): Promise<Member> {
  const photo_icon_url = await resolvePhotoUrl(
    photos.iconFile,
    existing.photo_icon_url,
    id,
    "icon"
  );
  const photo_bust_url = await resolvePhotoUrl(
    photos.bustFile,
    existing.photo_bust_url,
    id,
    "bust"
  );
  const { attachment_url, attachment_name } = await resolveAttachment(
    photos.attachmentFile,
    photos.removeAttachment,
    { attachment_url: existing.attachment_url, attachment_name: existing.attachment_name },
    id
  );

  if (supabase) {
    const data = await updateMemberSafely(id, {
      ...input,
      photo_icon_url,
      photo_bust_url,
      attachment_url,
      attachment_name,
    });
    return normalizeMember(data);
  }

  const members = loadDummyMembers();
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) throw new Error("メンバーが見つかりません");

  const updated: Member = {
    ...members[index],
    ...input,
    photo_icon_url,
    photo_bust_url,
    attachment_url,
    attachment_name,
  };
  members[index] = updated;
  saveDummyMembers(members);
  return updated;
}

/**
 * メンバーを削除する。
 */
export async function deleteMember(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const members = loadDummyMembers().filter((m) => m.id !== id);
  saveDummyMembers(members);
}

/**
 * 一覧のドラッグ&ドロップによる手動並び順を保存する。
 * orderedIds の並び順どおりに sort_order (0始まりの連番) を割り当てる。
 */
export async function reorderMembers(orderedIds: string[]): Promise<void> {
  if (supabase) {
    const client = supabase;
    await Promise.all(
      orderedIds.map((id, index) => client.from("members").update({ sort_order: index }).eq("id", id))
    );
    return;
  }

  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
  const members = loadDummyMembers().map((m) =>
    orderMap.has(m.id) ? { ...m, sort_order: orderMap.get(m.id) as number } : m
  );
  saveDummyMembers(members);
}
