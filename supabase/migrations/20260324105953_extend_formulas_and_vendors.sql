-- Add sort_order to event_formulas (for drag-to-reorder)
ALTER TABLE public.event_formulas ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add extra fields to event_vendors
ALTER TABLE public.event_vendors ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.event_vendors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.event_vendors ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add custom categories to event_settings
ALTER TABLE public.event_settings ADD COLUMN IF NOT EXISTS custom_categories TEXT[] DEFAULT ARRAY['Salle','Traiteur','Alcool','DJ','Décoration','Photo','Sécurité','Autre']::TEXT[];
