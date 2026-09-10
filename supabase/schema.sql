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
