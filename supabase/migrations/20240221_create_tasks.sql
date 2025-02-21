-- Create tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  group_id text not null,
  group_name text not null,
  group_icon text not null,
  group_color text not null,
  start_date date not null,
  end_date date not null,
  completed boolean default false,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint tasks_date_check check (end_date >= start_date)
);

-- Set up RLS
alter table public.tasks enable row level security;

create policy "Users can view their own tasks."
  on public.tasks for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tasks."
  on public.tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own tasks."
  on public.tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own tasks."
  on public.tasks for delete
  using ( auth.uid() = user_id );

-- Create indexes
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_start_date_idx on public.tasks(start_date);
create index tasks_end_date_idx on public.tasks(end_date);
