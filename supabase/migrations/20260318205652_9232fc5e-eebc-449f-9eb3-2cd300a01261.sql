
-- Vendor contacts table
CREATE TABLE public.vendor_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  category TEXT NOT NULL DEFAULT 'Autre',
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vendor contacts"
  ON public.vendor_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vendor contacts"
  ON public.vendor_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vendor contacts"
  ON public.vendor_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vendor contacts"
  ON public.vendor_contacts FOR DELETE USING (auth.uid() = user_id);

-- Vendor contracts table
CREATE TABLE public.vendor_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_contact_id UUID NOT NULL REFERENCES public.vendor_contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired', 'cancelled')),
  start_date DATE,
  end_date DATE,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
  ON public.vendor_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contracts"
  ON public.vendor_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contracts"
  ON public.vendor_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contracts"
  ON public.vendor_contracts FOR DELETE USING (auth.uid() = user_id);

-- Vendor exchange history table
CREATE TABLE public.vendor_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_contact_id UUID NOT NULL REFERENCES public.vendor_contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('email', 'call', 'meeting', 'note')),
  subject TEXT NOT NULL,
  content TEXT,
  exchange_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exchanges"
  ON public.vendor_exchanges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exchanges"
  ON public.vendor_exchanges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exchanges"
  ON public.vendor_exchanges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exchanges"
  ON public.vendor_exchanges FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vendor_contacts_updated_at
  BEFORE UPDATE ON public.vendor_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_contracts_updated_at
  BEFORE UPDATE ON public.vendor_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
