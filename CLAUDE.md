@AGENTS.md

# BNI ENISHIチャプター メンバー管理システム

BNI(Business Network International)のチャプター運営を支援する社内ツール。メンバー名簿管理、グループ編成、コンタクトサークルマップ、PDF出力、メインプレゼンターのスケジュール管理、パワーチーム別リファーラル募集掲示板を提供する。UIは全て日本語。

このファイルは、どのチャットセッションからでも開発コンテキストを即座に再構築できるようにするための索引。個々の実装詳細はコード自体(特に各 `src/lib/*.ts` のJSDocコメント)を正とし、ここでは全体像・設計判断・落とし穴を記録する。

## 技術スタック

- **Next.js 16.3.4**(App Router, Turbopack)。**注意**: 学習データにある一般的なNext.jsと破壊的変更があるバージョン。コードを書く前に `node_modules/next/dist/docs/` のガイドを確認すること(`AGENTS.md` 参照、`next dev` 実行時に自動再生成される)。
- React 19.2.8 / TypeScript 5 / Tailwind CSS 4
- Supabase(`@supabase/supabase-js`) — DB(Postgres)とStorage(ファイル保存)
- `@react-pdf/renderer` — PDF帳票生成(ブラウザ側で生成・ダウンロード、サーバーサイドAPIなし)
- `@dnd-kit/core` / `@dnd-kit/sortable` — ドラッグ&ドロップ(メンバー一覧の手動並べ替え、グループ編成ボード)
- `qrcode` — QRコード生成(data URL)
- `react-easy-crop` — 写真アップロード時のトリミング
- `lucide-react` — アイコン

### コマンド

```
npm run dev     # 開発サーバー
npm run build   # 本番ビルド(型チェック含む。変更後は必ずこれでエラーがないか確認する)
npm run lint    # eslint
```

### 環境変数(`.env.local`、`.env.local.example` 参照)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

未設定の場合は `src/lib/supabase.ts` の `supabase` が `null` になり、**全機能がlocalStorageベースのダミーデータで動作する**(下記「ダミーモード」参照)。開発中にSupabaseなしで一通り触れるのはこのため。

## アーキテクチャ

- `src/app/` — ルーティング(App Router)。主要ページ:
  - `/members` — メンバー管理(一覧・追加編集・詳細モーダル)。トップページ `/` はここへリダイレクト。
  - `/groups` — グループ編成ボード(ドラッグ&ドロップでメンバーをグループに割り当て、パターン保存)
  - `/matrix` — コンタクトサークルマップ(業種カテゴリ × コンタクトサークルの表、空席可視化)
  - `/presenters` — メインプレゼンター管理(週次スケジュールのリスト/カレンダー表示)
  - `/referrals` — パワーチーム別リファーラル募集掲示板
  - `/pdf` — PDF帳票プレビュー・ダウンロード(メンバーリスト、グループ配置)
  - `/settings/teams` — チーム(委員会)マスタ管理
  - `/m/[id]` — メンバー個人のデジタル名刺ページ(QRコードの遷移先、`show_qr_code` がtrueの場合のみQR表示)
- `src/components/` — UIコンポーネント。ページ直下のものはトップレベル、グループ編成専用は `groups/` サブディレクトリ
- `src/lib/` — データアクセス層・ドメインロジック。**Supabase設定時はDB、未設定時はlocalStorage** に読み書きする関数群(下記参照)
- `src/lib/pdf/` — `@react-pdf/renderer` のDocumentコンポーネント群とフォント登録・画像解決ヘルパー
- `supabase/schema.sql` — 全テーブル・RLSポリシー・Storageバケットの定義。**何度実行しても安全(冪等)**。`create table if not exists` + `alter table add column if not exists` の積み重ねで書く(理由は後述)

## データアクセス層の設計パターン(重要・踏襲すること)

`src/lib/members.ts` `presentations.ts` `referralRequests.ts` `teams.ts` は全て同じ形:

```ts
export async function fetchX(): Promise<X[]> {
  if (supabase) {
    const { data, error } = await supabase.from("x").select("*")...;
    if (error) throw error;
    return normalize(data);
  }
  return loadDummyX(); // localStorageフォールバック
}
```

新しいエンティティを追加する場合はこのパターンを踏襲する。理由: Supabase未設定の開発環境やデモ環境でもアプリ全体が動作する必要があるため。

### ダミーモード(localStorageフォールバック)

- 各エンティティごとに `bni-dummy-<entity>-v<N>` というキーでlocalStorageに保存
- スキーマを破壊的に変更した場合は `v1` → `v2` のようにキーのバージョンを上げ、古い形式のデータが混在してクラッシュしないようにする(`members.ts` の `DUMMY_STORAGE_KEY` コメント参照)
- 初回アクセス時にシードデータ(ダミーメンバー6名など)を自動生成

### PostgrestError対策(2つの独立した仕組み、混同しないこと)

1. **列が存在しない場合の自動フォールバック**(`src/lib/postgrestError.ts` の `extractMissingColumn`)
   本番DBのマイグレーション(`schema.sql`の再実行)が漏れていて新しいカラムが存在しない場合、insert/updateのペイロードからそのカラムを自動的に除いて再送信する。`members.ts` の `insertMemberSafely` / `updateMemberSafely` が使用。
2. **カラム名ゆれの自動フォールバック**(`src/lib/presentations.ts` の `withDateColumnFallback`)
   `presentations` テーブルの日付カラムが `presentation_date` でも `present_date` でもエラーにならないよう、両方の名前を試して成功した方をセッション内でキャッシュする。**特定カラムの命名ゆれに対する専用実装**であり、1番の汎用ドロップ方式とは別物。同様の問題が別テーブルで起きた場合はこのパターンを流用してよいが、まず「本当にカラム名が違うのか」を疑うこと(場当たり的にフォールバックを増やすと本当のバグを隠す)。
3. エラー表示は必ず `src/lib/errorMessage.ts` の `getErrorMessage(err)` を通すこと。SupabaseのPostgrestErrorは `Error` のインスタンスではないため、素朴に `String(err)` すると `[object Object]` になる(過去に実際に起きた不具合)。

### ファイルアップロードの設計パターン

`src/lib/memberPhotos.ts`(顔写真)/ `src/lib/memberAttachments.ts`(メンバー添付資料)/ `src/lib/presentationMaterials.ts`(プレゼン資料)は同じ形:
- Supabase設定時: Storageバケットにアップロードして公開URLを返す
- 未設定時: `src/lib/fileToDataUrl.ts` でdata URLに変換してlocalStorageに保存

呼び出し側(`members.ts` の `resolveAttachment` 等)は「新しいファイルが来たらアップロード、来なければ既存URL維持、削除フラグが立っていれば空にする」という3分岐を共通で持つ。

## Supabaseスキーマ概要

正はリポジトリ直下 `supabase/schema.sql`(Supabase SQL Editorに全文貼り付けて実行する運用)。要点のみここに記す。**カラムを追加するたびに `alter table add column if not exists` を追記し、`create table` 自体には最小限の列しか書かない**(冪等性を保ち、既存本番DBを壊さずに何度でも適用できるようにするため)。

### `members`(メンバー名簿の本体)

主なカラム: `id`(uuid, PK) `chapter` `role`(役職) `name` `name_kana` `company` `category`(業種) `team`(委員会) `wanted_referral`(欲しいリファーラル) `gold_referral` `silver_referral` `bronze_referral`(金銀銅のリファーラル) `comment` `contact`(電話) `email` `hp_url` `photo_icon_url`(アイコン用、正方形/円形) `photo_bust_url`(PDF名簿用バストアップ) `custom_fields`(jsonb配列、`{key, value}[]`) `sort_order`(手動並べ替え) `digital_card_url` `line_url` `instagram_url` `facebook_url`(デジタル名刺ページのリンク集) `show_qr_code`(boolean、デジタル名刺QR表示のON/OFF) `attachment_url` `attachment_name`(添付資料PDF等) `created_at`

型定義は `src/lib/members.ts` の `Member` / `MemberInput`。**要件文書などでカラム名として `chapter_name` `position` `phone` `website_url` `desired_referrals` のような別名が出てきても、既存のDBカラム名(`chapter` `role` `contact` `hp_url` `wanted_referral`)を優先しリネームしない**(過去の指示で明示的にこの方針を採用済み。互換性維持のため)。

### `teams`(チーム/委員会マスタ)

`id`(uuid, PK) `name`(unique) `created_at`。メンバー登録フォームの「チーム」プルダウンの選択肢。`/settings/teams` で管理。

### `presentations`(メインプレゼンター・ウィークリーカレンダー)

`id`(uuid, PK) `presentation_date`(date, ⚠️本番DBでは `present_date` の場合あり→上記フォールバック参照) `member_id`(uuid, `members.id` へのFK, on delete set null) `theme`(プレゼンテーマ) `material_url` `material_name`(資料PDF/PPT等) `created_at`

型定義は `src/lib/presentations.ts` の `Presentation` / `PresentationInput`。

### `referral_requests`(パワーチーム別リファーラル募集掲示板)

`id`(uuid, PK) `category`(募集カテゴリ、not null) `power_team`(対象パワーチーム) `description`(詳細説明) `contact_member_id`(uuid, `members.id` へのFK、紹介窓口) `status`(`'open' | 'in_progress' | 'fulfilled'`、DB上はcheck制約なしtext、アプリ側でバリデーション) `created_at`

型定義は `src/lib/referralRequests.ts`。ステータスの日本語ラベルは `REFERRAL_STATUS_LABELS`(募集中/調整中/充足)。

### Storageバケット(すべてpublic)

- `member-photos` — 顔写真(アイコン/バストアップ)
- `member-attachments` — メンバー詳細の添付資料
- `presentation-materials` — プレゼン資料

全バケット共通: 読み取りは誰でも可、書き込み(insert/update/delete)は `authenticated` ロールのみ。

## 実装済み機能

- **メンバー管理**(`/members`): 一覧(カード表示、並び替え: 登録日順/五十音順/チーム順/手動ドラッグ&ドロップ)、追加・編集フォーム、詳細モーダル(全項目表示、金銀銅リファーラルは色付きバッジ)、顔写真の真下にQRコード画像を常時直接表示(スキャン可能なPNG、`show_qr_code` ON時のみ)、1to1プロファイルシートPDF出力(詳細モーダルから)
- **グループ編成**(`/groups`): メンバーをドラッグ&ドロップで複数グループに割り当て、パターン(編成案)として複数保存・複製、代理参加者バッジの追加
- **コンタクトサークルマップ**(`/matrix`): 業種カテゴリをコンタクトサークル(建築/美容健康/経営者サポート/不動産資産/ITクリエイティブ/その他)ごとに分類し、空席カテゴリを「絶賛募集中」で可視化
- **PDF出力**(`/pdf`): メンバーリストPDF(QRコード付き)、グループ配置PDF。プレビュー付きダウンロード
- **メインプレゼンター管理**(`/presenters`): リスト表示(今後の予定/過去の実績)とカレンダー表示(月グリッド)の切り替え、プレゼン資料アップロード、次回プレゼンターのカウントダウンリマインドバナー(`/presenters` と `/members` の画面上部に表示)
- **リファーラル募集掲示板**(`/referrals`): ステータス別フィルタ(全て/募集中/調整中/充足)、カテゴリ色分けバッジ、パワーチームタグ、紹介窓口メンバー表示
- **チーム管理**(`/settings/teams`): 委員会の追加・編集・削除

## 開発上の注意点

- **Windows環境**: シェルはPowerShell(Bashツールも利用可)。改行コードはCRLFに正規化される設定(`.gitattributes`?は未確認)。`git add`/`git commit` 時に `LF will be replaced by CRLF` という警告が出るが無害、無視してよい。
- **ビルド確認を徹底する**: コード変更後は必ず `npm run build` を実行し、TypeScriptの型エラー・ESLintエラーがないことを確認してからコミットする(ブラウザでの動作確認は明示的に求められない限り省略してよい、と過去のやり取りで合意済み)。
- **コミット・push**: ユーザーから明示的に依頼された場合のみ実行する。コミットメッセージは英語の命令形が基本(過去のコミット例参照)。
- **既存フィールド名の維持**: 新しい要件でカラム名が指定されても、既存実装と意味が同じなら既存の英語カラム名を優先する(上記「Supabaseスキーマ概要」内の注意参照)。
- **新規カラム追加時**: 型定義(`Member`/`Presentation`/`ReferralRequest`等)に追加 → `normalize*` 関数にフォールバック値(`?? ""` 等)を追加 → フォーム/詳細画面に反映 → `supabase/schema.sql` に `alter table add column if not exists` を追記、の順で行う。本番マイグレーションはユーザーがSupabase SQL Editorで手動実行する運用のため、**アプリコード側は必ず「カラムがまだ存在しない」ケースを壊れずに扱えるようにする**(上記フォールバックパターン参照)。
- **コメントは最小限**: 「なぜ」が非自明な箇所(react-pdfの画像制約、QRコードのformat=png指定理由、localStorageキーのバージョニング理由など)にのみ日本語コメントを残す。何をしているかの説明コメントは書かない。
- **デザインの一貫性**: Tailwindの角丸バッジ・ピル型ボタンなど既存コンポーネントのクラス構成(`rounded-full` `dark:` 対応など)を踏襲する。ライト/ダーク両対応必須。

## 開発経緯(主なコミット、直近が上)

1. `Display QR code directly on member card, fix presenter column query, and populate member select options` — QRコード常時表示化、presentationsのカラム名フォールバック、担当メンバー選択肢のバグ修正
2. `Add 1to1 PDF generator, weekly presenter calendar, and referral request board` — 3機能追加(1to1シートPDF、プレゼンカレンダー、リファーラル掲示板)
3. `Fix [object Object] error display and add PDF attachment support for members` — エラー表示の`getErrorMessage`統一、メンバー添付資料アップロード機能
4. `Add member detail modal, layout adjustment, and profile field extensions` — QRコード配置変更、詳細モーダル新設、金銀銅リファーラル等のプロフィール項目拡張
5. `Fix missing fields and font style in PDF generator` / `会員リストPDFに連絡先とメールアドレスの表示を追加` — PDF帳票の改善
6. `Initial commit` — プロジェクト初期状態(Create Next App由来)

## 本番デプロイ時の注意

Supabase側のテーブル・Storageバケットは自動マイグレーションされない。機能追加でスキーマを変更した場合は、**`supabase/schema.sql` の内容をSupabase SQL Editorに貼り付けて実行するようユーザーに案内する**こと(このリポジトリにはマイグレーション自動適用の仕組みはない)。
