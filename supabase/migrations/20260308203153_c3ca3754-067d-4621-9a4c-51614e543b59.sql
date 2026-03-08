CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  what_they_sell TEXT NOT NULL,
  company_size TEXT NOT NULL,
  deal_size TEXT NOT NULL,
  primary_contact TEXT NOT NULL,
  deal_stage TEXT NOT NULL,
  generated_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);