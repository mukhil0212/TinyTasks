export interface Reminder {
  id: string;
  task_id: string;
  remind_at: string;
  is_enabled: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  group_id: string;
  group_name: string;
  group_icon: string;
  group_color: string;
  start_date: string;
  end_date: string;
  completed: boolean;
  user_id: string;
  created_at: string;
  reminder?: Reminder;
  google_calendar_event_id?: string;
}
