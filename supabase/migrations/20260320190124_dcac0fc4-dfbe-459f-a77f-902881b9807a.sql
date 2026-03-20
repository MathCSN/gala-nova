
-- Event formulas table
CREATE TABLE public.event_formulas (
  id text NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  max_capacity integer NOT NULL DEFAULT 0,
  sold integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#7C3AED',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.event_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own formulas" ON public.event_formulas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_event_formulas_updated_at BEFORE UPDATE ON public.event_formulas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event vendors table
CREATE TABLE public.event_vendors (
  id text NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Autre',
  cost_type text NOT NULL DEFAULT 'fixed',
  estimated_cost numeric NOT NULL DEFAULT 0,
  actual_cost numeric,
  status text NOT NULL DEFAULT 'quote',
  assigned_formulas text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vendors" ON public.event_vendors FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_event_vendors_updated_at BEFORE UPDATE ON public.event_vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event settings table
CREATE TABLE public.event_settings (
  user_id uuid PRIMARY KEY,
  contingency_percent numeric NOT NULL DEFAULT 10,
  target_margin_percent numeric NOT NULL DEFAULT 15,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON public.event_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_event_settings_updated_at BEFORE UPDATE ON public.event_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Logistics tasks table
CREATE TABLE public.event_tasks (
  id text NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  assignee text NOT NULL DEFAULT '',
  deadline text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON public.event_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_event_tasks_updated_at BEFORE UPDATE ON public.event_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
