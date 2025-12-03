-- Remove Google Calendar integration
alter table public.tasks drop column if exists google_calendar_event_id;
