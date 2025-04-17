-- Add parent_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create index for parent_id
CREATE INDEX IF NOT EXISTS tasks_parent_id_idx ON public.tasks(parent_id);
