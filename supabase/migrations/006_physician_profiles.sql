-- Physician profiles for richer doctor profile data persisted in Supabase
-- Creates a physician_profiles table with JSONB payload for flexibility

create table if not exists physician_profiles (
  physician_id uuid primary key,
  email text,
  specialty text,
  profile_image_url text,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table physician_profiles enable row level security;

-- Policies: physicians can manage their own profile (auth.uid())
create policy "physician_profiles_select_own"
  on physician_profiles for select
  using (physician_id = auth.uid());

create policy "physician_profiles_insert_own"
  on physician_profiles for insert
  with check (physician_id = auth.uid());

create policy "physician_profiles_update_own"
  on physician_profiles for update
  using (physician_id = auth.uid());

-- Trigger to maintain updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_physician_profiles_updated
before update on physician_profiles
for each row execute function set_updated_at();
