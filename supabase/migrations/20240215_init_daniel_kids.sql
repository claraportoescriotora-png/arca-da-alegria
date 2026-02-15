
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  subscription_status text check (subscription_status in ('active', 'pending', 'canceled')) default 'pending',
  permissions text[] default '{}',
  xp integer default 0,
  coins integer default 0,
  level integer default 1,
  streak integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, subscription_status)
  values (new.id, new.raw_user_meta_data->>'full_name', 'pending');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STORIES TABLE
create table public.stories (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  cover_url text,
  audio_url text,
  category text check (category in ('biblical', 'moral')) not null,
  is_premium boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Stories
alter table public.stories enable row level security;

create policy "Stories are viewable by everyone"
  on stories for select
  using ( true ); -- We handle logic in frontend/middleware, usually safer to just allow read and filter by premium status in UI or separate policy

-- MISSIONS TABLE
create table public.missions (
  id uuid default uuid_generate_v4() primary key,
  day_number integer not null,
  title text not null,
  description text,
  xp_reward integer default 10,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Missions
alter table public.missions enable row level security;

create policy "Missions are viewable by everyone"
  on missions for select
  using ( true );

-- USER PROGRESS TABLE
create table public.user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  mission_id uuid references public.missions(id),
  story_id uuid references public.stories(id),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, mission_id), -- Prevent duplicate mission completion
  unique(user_id, story_id)    -- Prevent duplicate story completion
);

-- RLS for Progress
alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on user_progress for select
  using ( auth.uid() = user_id );

create policy "Users can insert own progress"
  on user_progress for insert
  with check ( auth.uid() = user_id );
