-- Add last_name column to evaluation_students so that imported surnames can be stored
ALTER TABLE public.evaluation_students
  ADD COLUMN last_name TEXT;

CREATE INDEX idx_eval_students_last_name ON public.evaluation_students(last_name);
