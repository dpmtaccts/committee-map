
-- Drop old submissions table and create new one with updated schema
DROP TABLE IF EXISTS public.submissions;

CREATE TABLE public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  input_path text NOT NULL,
  product_type text,
  industry text,
  buying_department text,
  company_size text,
  deal_size text,
  deal_stage text,
  contact_level text,
  deal_summary text,
  results jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);
