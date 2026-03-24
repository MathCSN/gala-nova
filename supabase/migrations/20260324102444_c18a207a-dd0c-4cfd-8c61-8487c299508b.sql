
CREATE POLICY "Admins can update allowed emails"
ON public.allowed_emails
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
