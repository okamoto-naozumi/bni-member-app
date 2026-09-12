@AGENTS.md

# BNI ENISHIチャプター メンバー管理システム

BNI(Business Network International)のチャプター運営を支援する社内ツール。メンバー名簿管理、グループ編成、コンタクトサークルマップ、PDF出力、メインプレゼンターのスケジュール管理、パワーチーム別リファーラル募集掲示板、資料ライブラリを提供する。UIは全て日本語。

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
  - `/library` — 資料ライブラリ(Googleドライブ等の外部共有リンク集)
  - `/calendar` — カレンダー(月/週/日表示切り替え、カテゴリ別フィルタ、予定のCRUD、CSVインポート/エクスポート)
  - `/one-on-ones` — 1to1実施マトリクス(メンバー×メンバーの対戦表、実施日・メモの記録、未実施ペアのハイライト、実施率表示)
  - `/visitors` — ビジター招待・追跡ボード(打診中/参加確定/入会検討中/入会済の4カラムボード)
  - `/pdf` — PDF帳票プレビュー・ダウンロード(メンバーリスト、グループ配置)
  - `/about` — アバウト・利用ガイド(全機能の概要と使い方を説明する静的ページ)
  - `/settings/teams` — チーム(委員会)マスタ管理
  - `/m/[id]` — メンバー個人のデジタル名刺ページ(QRコードの遷移先、`show_qr_code` がtrueの場合のみQR表示)
- `src/components/` — UIコンポーネント。ページ直下のものはトップレベル、グループ編成専用は `groups/` サブディレクトリ
- `src/lib/` — データアクセス層・ドメインロジック。**Supabase設定時はDB、未設定時はlocalStorage** に読み書きする関数群(下記参照)
- `src/lib/pdf/` — `@react-pdf/renderer` のDocumentコンポーネント群とフォント登録・画像解決ヘルパー
- `supabase/schema.sql` — 全テーブル・RLSポリシー・Storageバケットの定義。**何度実行しても安全(冪等)**。`create table if not exists` + `alter table add column if not exists` の積み重ねで書く(理由は後述)

## データアクセス層の設計パターン(重要・踏襲すること)

`src/lib/members.ts` `presentations.ts` `referralRequests.ts` `teams.ts` `events.ts` `eventCategories.ts` `oneOnOnes.ts` `visitorInvites.ts` は全て同じ形:

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
2. **カラム名ゆれの自動フォールバック**(`src/lib/presentations.ts` の `withDateColumnFallback`、`src/lib/referralRequests.ts` の `withTeamColumnFallback`)
   `presentations` テーブルの日付カラムが `presentation_date` でも `present_date` でもエラーにならないよう、両方の名前を試して成功した方をセッション内でキャッシュする。同様に `referral_requests` テーブルの対象パワーチームカラムも `power_team` / `team` の両方を試す。**特定カラムの命名ゆれに対する専用実装**であり、1番の汎用ドロップ方式とは別物。この方式はinsert/updateのペイロードに実際のカラム名を指定する必要がある場合に使う(select("*")は存在するカラムをそのまま返すだけなので、読み取り側は `row.power_team ?? row.team ?? ""` のように両方を見るだけで済み、リトライは不要)。同様の問題が別テーブルで起きた場合はこのパターンを流用してよいが、まず「本当にカラム名が違うのか」を疑うこと(場当たり的にフォールバックを増やすと本当のバグを隠す)。
3. エラー表示は必ず `src/lib/errorMessage.ts` の `getErrorMessage(err)` を通すこと。SupabaseのPostgrestErrorは `Error` のインスタンスではないため、素朴に `String(err)` すると `[object Object]` になる(過去に実際に起きた不具合)。
4. **例外: `src/lib/libraryLinks.ts` `src/lib/events.ts` `src/lib/eventCategories.ts` `src/lib/referralRequests.ts` `src/lib/oneOnOnes.ts` `src/lib/visitorInvites.ts` はエラーを画面に伝播させず、Supabaseアクセスが失敗したら黙ってlocalStorageにフォールバックする**(`withLocalFallback` ヘルパー、各ファイルに同じ実装を個別に持つ)。members/presentationsは失敗をユーザーに知らせる設計だが、これらは「テーブル未作成・通信エラーでも機能自体は使えてほしい」という明示的な要件のため意図的に例外としている(カレンダー機能・リファーラル掲示板・1to1マトリクス・ビジター追跡ボードともに要件定義時点でこの挙動が明示的に指定された)。新しいエンティティを追加する際は、エラーを表示すべきか黙ってフォールバックすべきかを都度判断すること(デフォルトはエラー表示、明示的な要件があれば黙ってフォールバック)。

### ファイルアップロードの設計パターン

`src/lib/memberPhotos.ts`(顔写真)/ `src/lib/memberAttachments.ts`(メンバー添付資料)/ `src/lib/presentationMaterials.ts`(プレゼン資料)は同じ形:
- Supabase設定時: Storageバケットにアップロードして公開URLを返す
- 未設定時: `src/lib/fileToDataUrl.ts` でdata URLに変換してlocalStorageに保存

呼び出し側(`members.ts` の `resolveAttachment` 等)は「新しいファイルが来たらアップロード、来なければ既存URL維持、削除フラグが立っていれば空にする」という3分岐を共通で持つ。

## 命名の注意: `categories.ts` と `eventCategories.ts` は別物

- `src/lib/categories.ts` — メンバーの業種カテゴリ定数 `MEMBER_CATEGORIES`(税理士、司法書士…)を定義する**静的な定数ファイル**。DBアクセスなし。`MemberForm.tsx` `ReferralRequestForm.tsx` `contactCircles.ts`(コンタクトサークルマップ)から参照される。
- `src/lib/eventCategories.ts` — カレンダー機能の `categories` テーブル(id/name/sort_order)に対する**CRUDデータアクセス層**。`fetchCategories` `createCategory` `updateCategory` `deleteCategory` `ensureCategoryByName` を提供。

## 命名の注意: `powerTeams.ts` と `memberPowerTeams.ts` は別物

- `src/lib/powerTeams.ts` — パワーチーム名の自由入力候補 `POWER_TEAM_SUGGESTIONS`(士業パワーチーム、建築・不動産パワーチーム…)を定義する**静的な定数ファイル**。`referral_requests.power_team` の入力補助(datalist)専用で、メンバーとの紐付けは持たない。
- `src/lib/memberPowerTeams.ts` — メンバーの `category`(業種)から所属パワーチームを**自動判定するマッピングロジック**(`getPowerTeamForCategory` `buildPowerTeamGroups`)。メンバーに専用の「パワーチーム」カラムは存在しないため、`/members` のサークルマップ表示・全メンバーリストPDFのパワーチーム表示はすべてこのカテゴリ→パワーチーム対応表に基づく派生値であり、DBに保存された値ではない。対応表を変更すると、これらの表示に反映される既存メンバーの所属パワーチームも変わる点に注意。
- 過去に一度、カレンダー機能追加時にこの2つを混同して `categories.ts` を上書きしてしまいそうになったことがある。**カレンダー関連のカテゴリを触るときは `eventCategories.ts` を使うこと。`categories.ts` を書き換えると業種カテゴリ・コンタクトサークルマップが壊れる。**

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

本番DBによっては対象パワーチームのカラム名が `power_team` ではなく `team` になっている場合があり、`withTeamColumnFallback` が両方を試して吸収する(上記「PostgrestError対策」2番参照)。また `referral_requests` は `libraryLinks.ts` 等と同様に、Supabase未設定・通信エラー時は黙ってlocalStorageへフォールバックする(上記4番参照)。

### `library_links`(資料ライブラリ。Googleドライブ等の外部共有リンク集)

`id`(uuid, PK) `title`(タイトル、not null) `description`(説明文) `url`(共有URL) `category`(例: 定例会資料/フォーマット/ガイドライン、`LIBRARY_CATEGORY_SUGGESTIONS` 参照) `created_at`

型定義・CRUD関数は `src/lib/libraryLinks.ts`。**このテーブルだけはエラー時に黙ってlocalStorageへフォールバックする**(上記「PostgrestError対策」4番参照)。

### `categories`(カレンダーのカテゴリマスタ)

`id`(uuid, PK) `name`(unique, not null) `sort_order`(bigint) `created_at`。型定義・CRUD関数は `src/lib/eventCategories.ts`(メンバー業種カテゴリの `src/lib/categories.ts` とは別物。上記「命名の注意」参照)。CSVインポート時に未知のカテゴリ名があれば `ensureCategoryByName` が自動作成する。

### `events`(カレンダーの予定)

`id`(uuid, PK) `title`(not null) `start_time` `end_time`(いずれも `"YYYY-MM-DDTHH:mm"` 形式の素の文字列、text型。タイムゾーン変換によるズレを避けるため timestamptz を使わずアプリ側で完結させている) `category_id`(uuid, `categories.id` へのFK, on delete set null) `color`(背景色、例: `#3b82f6`) `description` `location` `zoom_url` `created_at`

型定義・CRUD関数は `src/lib/events.ts`。終了日時が未入力の場合は `resolveEndTime()` が開始日時をそのまま適用する(所要時間0分)。CSVインポート/エクスポートは `src/lib/eventsCsv.ts` が担当する。

#### カレンダーCSVフォーマット(14列、ヘッダー行あり、UTF-8 BOM付き、CRLF改行)

| # | 列名 | 内容 |
|---|------|------|
| 1 | タイトル | イベント名(必須) |
| 2 | 開始年 | 例: 2026 |
| 3 | 開始月 | 例: 9 |
| 4 | 開始日 | 例: 15 |
| 5 | 開始時間 | 例: 09:00(必須。開始年月日と合わせて `start_time` を構成) |
| 6 | 終了年 | 空欄可 |
| 7 | 終了月 | 空欄可 |
| 8 | 終了日 | 空欄可 |
| 9 | 終了時間 | 空欄可(6〜9のいずれかが空なら開始日時を自動補完) |
| 10 | 詳細 | `description` |
| 11 | 場所 | `location` |
| 12 | Zoomリンク | `zoom_url` |
| 13 | 背景色 | `color`(例: `#3b82f6`。空欄なら既定色を使用) |
| 14 | カテゴリ名 | `categories.name` と名寄せ。存在しなければ自動でカテゴリを新規作成 |

タイトルまたは開始日時(2〜5列目)が欠けている行はインポート時にスキップされる。パース・生成ロジックはいずれも `src/lib/eventsCsv.ts` に実装されている(独自の軽量CSVパーサ。引用符・カンマ・改行を含むフィールドに対応)。

### `one_on_ones`(1to1実施マトリクス)

`id`(uuid, PK) `member_a_id` `member_b_id`(いずれも uuid, `members.id` へのFK, on delete cascade) `completed_at`(date, 実施日) `note`(進捗メモ) `created_at`

型定義・CRUD関数は `src/lib/oneOnOnes.ts`。1ペアにつき1レコードのみ持つ設計で、`member_a_id`/`member_b_id` は `pairKey()` で常にID文字列のソート順に正規化してから保存する(どちらの並び順でクリックしても同じレコードを指すようにするため)。**DBにユニーク制約は張っていない**(Postgresは列挙型`ADD CONSTRAINT IF NOT EXISTS`を持たないため、既存の冪等な`schema.sql`運用と相性が悪い)。代わりに `upsertOneOnOne()` が保存前に同じペアの既存行を検索し、あれば更新・なければ挿入することで一意性をアプリ側で保証している。

### `visitor_invites`(ビジター招待・追跡ボード)

`id`(uuid, PK) `visitor_name`(ビジター名、not null) `category`(対象カテゴリ) `inviter_member_id`(uuid, `members.id` へのFK、招待担当メンバー) `status`(`'invited' | 'confirmed' | 'considering' | 'joined'`、DB上はcheck制約なしtext、アプリ側でバリデーション) `notes`(進捗メモ) `created_at`

型定義・CRUD関数は `src/lib/visitorInvites.ts`。ステータスの日本語ラベルは `VISITOR_STATUS_LABELS`(打診中/参加確定/入会検討中/入会済)。

### Storageバケット(すべてpublic)

- `member-photos` — 顔写真(アイコン/バストアップ)
- `member-attachments` — メンバー詳細の添付資料
- `presentation-materials` — プレゼン資料

全バケット共通: 読み取りは誰でも可、書き込み(insert/update/delete)は `authenticated` ロールのみ。

## 実装済み機能

- **メンバー管理**(`/members`): 一覧(カード表示/サークルマップ表示の切り替え、並び替え: 登録日順/五十音順/チーム順/手動ドラッグ&ドロップ)、追加・編集フォーム、詳細モーダル(全項目表示、金銀銅リファーラルは色付きバッジ)、顔写真の真下にQRコード画像を常時直接表示(スキャン可能なPNG、`show_qr_code` ON時のみ)、1to1プロファイルシートPDF出力(詳細モーダルから)、全メンバーリストA4 PDF出力ボタン(ヘッダー、`MemberListDocument` を再利用)
  - **サークルマップ表示**: `src/lib/memberPowerTeams.ts` の対応表でメンバーをパワーチーム別にグループ化し、各チームの所属人数・所属メンバー・空きカテゴリー(「募集中」)を可視化する(`src/components/PowerTeamCircleMap.tsx`)。`/matrix` のコンタクトサークルマップとは別軸の分類(業種カテゴリ→パワーチーム)である点に注意。
  - **検索・タグフィルター**: 氏名/フリガナ/会社名のテキスト検索に加え、「欲しいリファーラルあり」「金/銀/銅バッジ」「パワーチーム」タグをワンタップでON/OFFできる絞り込みバー。カード表示・サークルマップ表示の両方に適用される。
- **グループ編成**(`/groups`): メンバーをドラッグ&ドロップで複数グループに割り当て、パターン(編成案)として複数保存・複製、代理参加者バッジの追加
- **コンタクトサークルマップ**(`/matrix`): 業種カテゴリをコンタクトサークル(建築/美容健康/経営者サポート/不動産資産/ITクリエイティブ/その他)ごとに分類し、空席カテゴリを「絶賛募集中」で可視化
- **PDF出力**(`/pdf`): メンバーリストPDF(QRコード付き)、グループ配置PDF。プレビュー付きダウンロード
- **メインプレゼンター管理**(`/presenters`): リスト表示(今後の予定/過去の実績)とカレンダー表示(月グリッド)の切り替え、プレゼン資料アップロード、次回プレゼンターのカウントダウンリマインドバナー(`/presenters` と `/members` の画面上部に表示)
- **リファーラル募集掲示板**(`/referrals`): ステータス別フィルタ(全て/募集中/調整中/充足)、カテゴリ色分けバッジ、パワーチームタグ、紹介窓口メンバー表示、カード表示/リスト表示の切り替え(リスト表示は横長テーブルで募集カテゴリ・対象パワーチーム・詳細説明・紹介窓口・ステータス・操作を1行にまとめ、多件の比較を容易にする。`overflow-x-auto` でモバイルでも崩れないようにしている)
- **カレンダー**(`/calendar`): 月/週/日ビュー切り替え、`categories` テーブルから動的生成されるカテゴリタブでの絞り込み、当日セルのハイライト、予定クリックでの詳細表示・編集モーダル、終了日時未入力時の自動補完(開始日時を適用)、14列CSVインポート/エクスポート(カテゴリ名の名寄せ自動作成込み)
- **1to1実施マトリクス**(`/one-on-ones`): メンバー×メンバーの対戦表UI。セルをクリックすると `OneOnOneForm` モーダルで実施日・メモを記録(1ペア1レコード、`upsertOneOnOne` が更新/新規作成を自動判定)。未実施ペアは amber、実施済みペアは emerald でハイライトし、上部に実施率(実施ペア数 / 全ペア数)を表示する。
- **ビジター招待・追跡ボード**(`/visitors`): 打診中/参加確定/入会検討中/入会済の4カラムボード。`VisitorInviteForm` モーダルでビジター名・対象カテゴリ・招待担当メンバー・進捗メモを追加編集削除。
- **資料ライブラリ**(`/library`): Googleドライブ等の外部共有リンクをタイトル・説明文・カテゴリ付きで登録、カテゴリ別フィルタ、「開く」ボタンで別タブ表示、追加・編集・削除モーダル
- **LINE / SNS共有ボタン**(`src/components/ShareButtons.tsx`): 「LINEで共有」(LINE公式のメッセージ共有URLを新規タブで開く)と「URLをコピー」(`navigator.clipboard`)の2ボタンをまとめたコンポーネント。`url` に `/` 始まりの相対パスを渡すとクリック時に `window.location.origin` を付与して絶対URL化する。メンバーカード(デジタル名刺URL)、1to1シートモーダル(同URL)、メインプレゼンター一覧のプレゼン資料リンク、リファーラル掲示板のカード(`/referrals` への案内文付きリンク)に組み込み済み。新しい箇所に追加する場合もこのコンポーネントを再利用すること。
- **アバウト・利用ガイド**(`/about`): 全機能(メンバー管理/1to1シートPDF/メインプレゼンターカレンダー/リファーラル掲示板/資料ライブラリ)の目的・使い方を紹介する静的な説明ページ。レスポンシブ・ライト/ダーク対応
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

1. `Implement circle map, tag filters, full PDF list, 1to1 matrix, SNS sharing, and visitor tracker with CLAUDE.md update` — パワーチーム別サークルマップ・タグ検索、LINE/SNS共有ボタン、全メンバーリストPDF出力ボタン、1to1実施マトリクス(`/one-on-ones`)、ビジター招待・追跡ボード(`/visitors`)の6機能を追加
2. `Add list view layout toggle and fix power_team fallback in referral board with CLAUDE.md update` — リファーラル掲示板にカード/リスト表示切り替え追加、power_team/teamカラム名フォールバックとlocalStorageフォールバック対応
3. `Add /calendar with dynamic category filtering, CSV import/export, and CLAUDE.md update` — カレンダー機能(月/週/日ビュー、動的カテゴリフィルタ、CSVインポート/エクスポート)追加
4. `Add /about guide page and /library shared links page with CLAUDE.md update` — アバウト・利用ガイドページ、資料ライブラリページ、ナビゲーション追加
5. `Display QR code directly on member card, fix presenter column query, and populate member select options` — QRコード常時表示化、presentationsのカラム名フォールバック、担当メンバー選択肢のバグ修正
6. `Add 1to1 PDF generator, weekly presenter calendar, and referral request board` — 3機能追加(1to1シートPDF、プレゼンカレンダー、リファーラル掲示板)
7. `Fix [object Object] error display and add PDF attachment support for members` — エラー表示の`getErrorMessage`統一、メンバー添付資料アップロード機能
8. `Add member detail modal, layout adjustment, and profile field extensions` — QRコード配置変更、詳細モーダル新設、金銀銅リファーラル等のプロフィール項目拡張
9. `Fix missing fields and font style in PDF generator` / `会員リストPDFに連絡先とメールアドレスの表示を追加` — PDF帳票の改善
10. `Initial commit` — プロジェクト初期状態(Create Next App由来)

## 本番デプロイ時の注意

Supabase側のテーブル・Storageバケットは自動マイグレーションされない。機能追加でスキーマを変更した場合は、**`supabase/schema.sql` の内容をSupabase SQL Editorに貼り付けて実行するようユーザーに案内する**こと(このリポジトリにはマイグレーション自動適用の仕組みはない)。
