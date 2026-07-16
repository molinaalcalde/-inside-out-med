-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (stores onboarding data)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  age integer,
  email text,
  phone text,
  goals jsonb default '[]',
  sensitivity text default 'media',
  budget text default 'medio',
  fitz integer default 3,
  sleep float default 7,
  stress text default 'medio',
  diet text default 'omnivora',
  exercise integer default 2,
  sun text default 'media',
  routine jsonb default '[]',
  prior jsonb default '[]',
  conditions jsonb default '[]',
  invasive text default 'todo',
  commitment text default 'full-home',
  consent jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scans table (stores each facial analysis)
create table if not exists public.scans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  scan_date timestamptz default now(),
  overall integer,
  visible_age float,
  age_delta float,
  age_range integer,
  percentile integer,
  symmetry integer,
  harmony integer,
  zones jsonb,
  bio jsonb,
  is_real boolean default false,
  quality integer default 0,
  samples integer default 0,
  created_at timestamptz default now()
);

-- Engagement table (stores plan choices)
create table if not exists public.engagements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  scan_id uuid references public.scans on delete cascade,
  data jsonb default '{}',
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.engagements enable row level security;

-- Policies: users can only access their own data
create policy "Users can manage their own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users can manage their own scans"
  on public.scans for all using (auth.uid() = user_id);

create policy "Users can manage their own engagements"
  on public.engagements for all using (auth.uid() = user_id);

-- Function to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
