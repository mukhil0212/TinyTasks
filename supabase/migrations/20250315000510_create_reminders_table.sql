create table if not exists public.reminders (
    id uuid not null primary key,
    task_id uuid not null references public.tasks(id) on delete cascade,
    remind_at timestamp with time zone not null,
    is_enabled boolean not null default true,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

alter table public.tasks add column if not exists google_calendar_event_id text;

-- Enable RLS
alter table public.reminders enable row level security;

-- Create policies
create policy "Users can only see their own reminders"
    on public.reminders for select
    using (
        task_id in (
            select id from public.tasks
            where user_id = auth.uid()
        )
    );

create policy "Users can only insert their own reminders"
    on public.reminders for insert
    with check (
        task_id in (
            select id from public.tasks
            where user_id = auth.uid()
        )
    );

create policy "Users can only update their own reminders"
    on public.reminders for update
    using (
        task_id in (
            select id from public.tasks
            where user_id = auth.uid()
        )
    );

create policy "Users can only delete their own reminders"
    on public.reminders for delete
    using (
        task_id in (
            select id from public.tasks
            where user_id = auth.uid()
        )
    );