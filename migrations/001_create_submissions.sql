CREATE TABLE IF NOT EXISTS submissions (
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
