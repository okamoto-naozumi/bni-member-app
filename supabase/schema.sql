-- BNI Members table
-- このスクリプトは何度実行しても安全(冪等)です。
-- 既存のテーブル・列・ポリシーがあってもエラーにならず、不足分だけを追加します。

create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- 過去バージョンのテーブルに対しても不足している列を追加する
alter table public.members add column if not exists chapter text;
alter table public.members add column if not exists role text;
alter table public.members add column if not exists name_kana text;
alter table public.members add column if not exists category text;
alter table public.members add column if not exists company text;
alter table public.members add column if not exists team text;
alter table public.members add column if not exists wanted_referral text;
alter table public.members add column if not exists comment text;
alter table public.members add column if not exists contact text;
alter table public.members add column if not exists email text;
alter table public.members add column if not exists hp_url text;
alter table public.members add column if not exists photo_icon_url text;
alter table public.members add column if not exists photo_bust_url text;
alter table public.members add column if not exists custom_fields jsonb not null default '[]'::jsonb;
alter table public.members add column if not exists sort_order bigint not null default 0;
alter table public.members add column if not exists digital_card_url text;
alter table public.members add column if not exists line_url text;
alter table public.members add column if not exists instagram_url text;
alter table public.members add column if not exists facebook_url text;
alter table public.members add column if not exists show_qr_code boolean not null default false;
alter table public.members add column if not exists created_at timestamptz not null default now();
alter table public.members add column if not exists gold_referral text;
alter table public.members add column if not exists silver_referral text;
alter table public.members add column if not exists bronze_referral text;
alter table public.members add column if not exists attachment_url text;
alter table public.members add column if not exists attachment_name text;

alter table public.members enable row level security;

drop policy if exists "Members are publicly readable" on public.members;
create policy "Members are publicly readable"
  on public.members for select
  using (true);

drop policy if exists "Authenticated users can insert members" on public.members;
create policy "Authenticated users can insert members"
  on public.members for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update members" on public.members;
create policy "Authenticated users can update members"
  on public.members for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete members" on public.members;
create policy "Authenticated users can delete members"
  on public.members for delete
  to authenticated
  using (true);

-- Teams (メンバー登録画面の「チーム」選択肢)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table public.teams add column if not exists created_at timestamptz not null default now();

alter table public.teams enable row level security;

drop policy if exists "Teams are publicly readable" on public.teams;
create policy "Teams are publicly readable"
  on public.teams for select
  using (true);

drop policy if exists "Authenticated users can insert teams" on public.teams;
create policy "Authenticated users can insert teams"
  on public.teams for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update teams" on public.teams;
create policy "Authenticated users can update teams"
  on public.teams for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete teams" on public.teams;
create policy "Authenticated users can delete teams"
  on public.teams for delete
  to authenticated
  using (true);

-- Storage bucket for member photos
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

drop policy if exists "Member photos are publicly readable" on storage.objects;
create policy "Member photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'member-photos');

drop policy if exists "Authenticated users can upload member photos" on storage.objects;
create policy "Authenticated users can upload member photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-photos');

drop policy if exists "Authenticated users can update member photos" on storage.objects;
create policy "Authenticated users can update member photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-photos');

drop policy if exists "Authenticated users can delete member photos" on storage.objects;
create policy "Authenticated users can delete member photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-photos');

-- Storage bucket for member business documents (PDF等の添付資料)
insert into storage.buckets (id, name, public)
values ('member-attachments', 'member-attachments', true)
on conflict (id) do nothing;

drop policy if exists "Member attachments are publicly readable" on storage.objects;
create policy "Member attachments are publicly readable"
  on storage.objects for select
  using (bucket_id = 'member-attachments');

drop policy if exists "Authenticated users can upload member attachments" on storage.objects;
create policy "Authenticated users can upload member attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-attachments');

drop policy if exists "Authenticated users can update member attachments" on storage.objects;
create policy "Authenticated users can update member attachments"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-attachments');

drop policy if exists "Authenticated users can delete member attachments" on storage.objects;
create policy "Authenticated users can delete member attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-attachments');

-- Presentations (メインプレゼンター・ウィークリーカレンダー)
create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  presentation_date date not null
);

alter table public.presentations add column if not exists member_id uuid references public.members(id) on delete set null;
alter table public.presentations add column if not exists theme text;
alter table public.presentations add column if not exists material_url text;
alter table public.presentations add column if not exists material_name text;
alter table public.presentations add column if not exists created_at timestamptz not null default now();

alter table public.presentations enable row level security;

drop policy if exists "Presentations are publicly readable" on public.presentations;
create policy "Presentations are publicly readable"
  on public.presentations for select
  using (true);

drop policy if exists "Authenticated users can insert presentations" on public.presentations;
create policy "Authenticated users can insert presentations"
  on public.presentations for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update presentations" on public.presentations;
create policy "Authenticated users can update presentations"
  on public.presentations for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete presentations" on public.presentations;
create policy "Authenticated users can delete presentations"
  on public.presentations for delete
  to authenticated
  using (true);

-- Referral requests (パワーチーム別 専門リファーラル募集掲示板)
create table if not exists public.referral_requests (
  id uuid primary key default gen_random_uuid(),
  category text not null
);

alter table public.referral_requests add column if not exists power_team text;
alter table public.referral_requests add column if not exists description text;
alter table public.referral_requests add column if not exists contact_member_id uuid references public.members(id) on delete set null;
alter table public.referral_requests add column if not exists status text not null default 'open';
alter table public.referral_requests add column if not exists created_at timestamptz not null default now();

alter table public.referral_requests enable row level security;

drop policy if exists "Referral requests are publicly readable" on public.referral_requests;
create policy "Referral requests are publicly readable"
  on public.referral_requests for select
  using (true);

drop policy if exists "Authenticated users can insert referral requests" on public.referral_requests;
create policy "Authenticated users can insert referral requests"
  on public.referral_requests for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update referral requests" on public.referral_requests;
create policy "Authenticated users can update referral requests"
  on public.referral_requests for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete referral requests" on public.referral_requests;
create policy "Authenticated users can delete referral requests"
  on public.referral_requests for delete
  to authenticated
  using (true);

-- Storage bucket for presentation materials (プレゼン資料 PDF/PPT等)
insert into storage.buckets (id, name, public)
values ('presentation-materials', 'presentation-materials', true)
on conflict (id) do nothing;

drop policy if exists "Presentation materials are publicly readable" on storage.objects;
create policy "Presentation materials are publicly readable"
  on storage.objects for select
  using (bucket_id = 'presentation-materials');

drop policy if exists "Authenticated users can upload presentation materials" on storage.objects;
create policy "Authenticated users can upload presentation materials"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'presentation-materials');

drop policy if exists "Authenticated users can update presentation materials" on storage.objects;
create policy "Authenticated users can update presentation materials"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'presentation-materials');

drop policy if exists "Authenticated users can delete presentation materials" on storage.objects;
create policy "Authenticated users can delete presentation materials"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'presentation-materials');

-- Library links (資料ライブラリ。Googleドライブ等の外部共有リンク集)
create table if not exists public.library_links (
  id uuid primary key default gen_random_uuid(),
  title text not null
);

alter table public.library_links add column if not exists description text;
alter table public.library_links add column if not exists url text;
alter table public.library_links add column if not exists category text;
alter table public.library_links add column if not exists created_at timestamptz not null default now();

alter table public.library_links enable row level security;

drop policy if exists "Library links are publicly readable" on public.library_links;
create policy "Library links are publicly readable"
  on public.library_links for select
  using (true);

drop policy if exists "Authenticated users can insert library links" on public.library_links;
create policy "Authenticated users can insert library links"
  on public.library_links for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update library links" on public.library_links;
create policy "Authenticated users can update library links"
  on public.library_links for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete library links" on public.library_links;
create policy "Authenticated users can delete library links"
  on public.library_links for delete
  to authenticated
  using (true);

-- Categories (カレンダーのカテゴリマスタ。CSVインポート時に名寄せ補完で自動作成されることもある)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table public.categories add column if not exists sort_order bigint not null default 0;
alter table public.categories add column if not exists created_at timestamptz not null default now();

alter table public.categories enable row level security;

drop policy if exists "Categories are publicly readable" on public.categories;
create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

drop policy if exists "Authenticated users can insert categories" on public.categories;
create policy "Authenticated users can insert categories"
  on public.categories for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update categories" on public.categories;
create policy "Authenticated users can update categories"
  on public.categories for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete categories" on public.categories;
create policy "Authenticated users can delete categories"
  on public.categories for delete
  to authenticated
  using (true);

-- Events (カレンダー機能の予定)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null
);

-- start_time / end_time はタイムゾーン変換によるズレを避けるため、
-- "YYYY-MM-DDTHH:mm" 形式の素の文字列として text 型で保持する(timestamptzは使わない)。
alter table public.events add column if not exists start_time text not null default '';
alter table public.events add column if not exists end_time text not null default '';
alter table public.events add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.events add column if not exists color text not null default '#3b82f6';
alter table public.events add column if not exists description text;
alter table public.events add column if not exists location text;
alter table public.events add column if not exists zoom_url text;
alter table public.events add column if not exists created_at timestamptz not null default now();

alter table public.events enable row level security;

drop policy if exists "Events are publicly readable" on public.events;
create policy "Events are publicly readable"
  on public.events for select
  using (true);

drop policy if exists "Authenticated users can insert events" on public.events;
create policy "Authenticated users can insert events"
  on public.events for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update events" on public.events;
create policy "Authenticated users can update events"
  on public.events for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete events" on public.events;
create policy "Authenticated users can delete events"
  on public.events for delete
  to authenticated
  using (true);

-- One-on-ones (1to1実施マトリクス。1ペアにつき1レコード。ユニーク制約はDBに張らずアプリ側で保証する)
create table if not exists public.one_on_ones (
  id uuid primary key default gen_random_uuid(),
  member_a_id uuid not null references public.members(id) on delete cascade,
  member_b_id uuid not null references public.members(id) on delete cascade
);

alter table public.one_on_ones add column if not exists completed_at date not null default current_date;
alter table public.one_on_ones add column if not exists note text;
alter table public.one_on_ones add column if not exists created_at timestamptz not null default now();

alter table public.one_on_ones enable row level security;

drop policy if exists "One-on-ones are publicly readable" on public.one_on_ones;
create policy "One-on-ones are publicly readable"
  on public.one_on_ones for select
  using (true);

drop policy if exists "Authenticated users can insert one-on-ones" on public.one_on_ones;
create policy "Authenticated users can insert one-on-ones"
  on public.one_on_ones for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update one-on-ones" on public.one_on_ones;
create policy "Authenticated users can update one-on-ones"
  on public.one_on_ones for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete one-on-ones" on public.one_on_ones;
create policy "Authenticated users can delete one-on-ones"
  on public.one_on_ones for delete
  to authenticated
  using (true);

-- Visitor invites (ビジター招待・追跡ボード)
create table if not exists public.visitor_invites (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null
);

alter table public.visitor_invites add column if not exists category text;
alter table public.visitor_invites add column if not exists inviter_member_id uuid references public.members(id) on delete set null;
alter table public.visitor_invites add column if not exists status text not null default 'invited';
alter table public.visitor_invites add column if not exists notes text;
alter table public.visitor_invites add column if not exists created_at timestamptz not null default now();

alter table public.visitor_invites enable row level security;

drop policy if exists "Visitor invites are publicly readable" on public.visitor_invites;
create policy "Visitor invites are publicly readable"
  on public.visitor_invites for select
  using (true);

drop policy if exists "Authenticated users can insert visitor invites" on public.visitor_invites;
create policy "Authenticated users can insert visitor invites"
  on public.visitor_invites for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update visitor invites" on public.visitor_invites;
create policy "Authenticated users can update visitor invites"
  on public.visitor_invites for update
  to authenticated
  using (true);

drop policy if exists "Authenticated users can delete visitor invites" on public.visitor_invites;
create policy "Authenticated users can delete visitor invites"
  on public.visitor_invites for delete
  to authenticated
  using (true);
