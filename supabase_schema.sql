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

-- ════════════════════════════════════════════════════════════════
-- NEW TABLES: Funnel, Brain, Admin
-- ════════════════════════════════════════════════════════════════

-- Funnel events (tracks every user step for analytics)
create table if not exists public.funnel_events (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null,
  user_id uuid references auth.users on delete set null,
  email text,
  event_type text not null,
  event_data jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_funnel_session on public.funnel_events(session_id);
create index if not exists idx_funnel_type on public.funnel_events(event_type);
create index if not exists idx_funnel_created on public.funnel_events(created_at desc);

-- Brain / Knowledge base (research papers)
create table if not exists public.papers (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  authors text,
  year integer,
  journal text,
  doi text,
  key_findings text,
  applicable_zones text[] default '{}',
  applicable_treatments text[] default '{}',
  tags text[] default '{}',
  full_citation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Treatment-paper junction
create table if not exists public.treatment_papers (
  id uuid default uuid_generate_v4() primary key,
  treatment_name text not null,
  paper_id uuid references public.papers on delete cascade,
  relevance text default 'primary'
);

-- Admin users
create table if not exists public.admin_users (
  id uuid references auth.users on delete cascade primary key,
  role text default 'admin',
  created_at timestamptz default now()
);

-- Leads table (stores user data even without auth — for funnel tracking)
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  session_id text not null,
  name text,
  age integer,
  email text,
  phone text,
  profile_data jsonb default '{}',
  scan_data jsonb,
  plan_data jsonb,
  funnel_stage text default 'started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_session on public.leads(session_id);
create index if not exists idx_leads_stage on public.leads(funnel_stage);

-- RLS for new tables
alter table public.funnel_events enable row level security;
alter table public.papers enable row level security;
alter table public.treatment_papers enable row level security;
alter table public.leads enable row level security;

-- Funnel events: anyone can insert (anonymous tracking)
create policy "Anyone can insert funnel events"
  on public.funnel_events for insert with check (true);

-- Leads: anyone can insert/update their own session
create policy "Anyone can insert leads"
  on public.leads for insert with check (true);
create policy "Anyone can update their own lead"
  on public.leads for update using (session_id = session_id);

-- Papers: public read, admin write
create policy "Anyone can read papers"
  on public.papers for select using (true);

-- Triggers for updated_at
create trigger on_lead_updated
  before update on public.leads
  for each row execute procedure public.handle_updated_at();
create trigger on_paper_updated
  before update on public.papers
  for each row execute procedure public.handle_updated_at();
