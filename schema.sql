-- FOCUS NEXUS MVP Database Schema
-- Science-based ADHD-friendly productivity app

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- User preferences
  noise_preference text check (noise_preference in ('off', 'white', 'pink')) default 'off',
  focus_duration integer default 25 check (focus_duration between 15 and 60),
  break_duration integer default 5 check (break_duration between 3 and 15),

  -- Gamification
  total_points integer default 0,
  level integer default 1,
  badges text[] default '{}',

  -- Settings
  timezone text default 'UTC',
  notifications_enabled boolean default true
);

-- Events table (core behavioral tracking)
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Event classification
  event_type text not null check (event_type in (
    'focus_session_start', 'focus_session_complete', 'focus_session_abandon',
    'break_start', 'break_complete',
    'if_then_plan_create', 'if_then_plan_trigger',
    'noise_toggle', 'app_open', 'app_close'
  )),

  -- Event context
  session_duration integer, -- in seconds
  plan_id uuid,
  metadata jsonb default '{}'::jsonb
);

-- If-Then plans table
create table public.if_then_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Plan structure
  if_condition text not null, -- "If [trigger/context]"
  then_action text not null,  -- "Then I will [specific behavior]"

  -- Classification
  category text check (category in ('time', 'location', 'emotional', 'social', 'custom')),
  is_active boolean default true,

  -- Usage tracking
  trigger_count integer default 0,
  last_triggered_at timestamp with time zone
);

-- RLS (Row Level Security) Policies
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.if_then_plans enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Events policies
create policy "Users can view own events" on public.events
  for select using (auth.uid() = user_id);

create policy "Users can insert own events" on public.events
  for insert with check (auth.uid() = user_id);

-- If-Then plans policies
create policy "Users can view own plans" on public.if_then_plans
  for select using (auth.uid() = user_id);

create policy "Users can insert own plans" on public.if_then_plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update own plans" on public.if_then_plans
  for update using (auth.uid() = user_id);

create policy "Users can delete own plans" on public.if_then_plans
  for delete using (auth.uid() = user_id);

-- Indexes for performance
create index events_user_id_created_at_idx on public.events(user_id, created_at desc);
create index events_event_type_idx on public.events(event_type);
create index if_then_plans_user_id_active_idx on public.if_then_plans(user_id, is_active);

-- Updated at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger if_then_plans_updated_at before update on public.if_then_plans
  for each row execute procedure public.handle_updated_at();

-- Since-wake statistics function (timezone-safe)
create or replace function public.get_since_wake_stats()
returns json
language sql security invoker as $$
  with user_tz as (
    select coalesce(timezone, 'UTC') as tz from public.profiles where id = auth.uid()
  ),
  wake_time as (
    select 
      date_trunc('day', timezone(user_tz.tz, now())) + interval '6 hours' as assumed_wake
    from user_tz
  ),
  today_events as (
    select *
    from public.events e
    cross join user_tz
    where 
      e.user_id = auth.uid() 
      and e.created_at >= timezone(user_tz.tz, (select assumed_wake from wake_time))
  )
  select json_build_object(
    'focus_sessions_completed', 
    coalesce((select count(*) from today_events where event_type = 'focus_session_complete'), 0),
    'total_focus_time',
    coalesce((select sum(session_duration) from today_events where event_type = 'focus_session_complete'), 0),
    'plans_triggered',
    coalesce((select count(*) from today_events where event_type = 'if_then_plan_trigger'), 0),
    'last_session_duration',
    coalesce((select session_duration from today_events where event_type = 'focus_session_complete' order by created_at desc limit 1), 0)
  );
$$;
