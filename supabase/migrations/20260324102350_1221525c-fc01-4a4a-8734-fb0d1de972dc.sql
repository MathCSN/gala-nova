
ALTER TABLE public.allowed_emails ADD COLUMN invite_code text;

CREATE OR REPLACE FUNCTION public.verify_invite_code(_email text, _code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE email = lower(trim(_email))
      AND invite_code = _code
  )
$$;

DROP POLICY IF EXISTS "Users can check own email" ON public.allowed_emails;

CREATE POLICY "Anon cannot read allowed emails"
ON public.allowed_emails
FOR SELECT
TO anon
USING (false);
