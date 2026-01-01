-- Create knowledge_notes table
CREATE TABLE IF NOT EXISTS public.knowledge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text CHECK (note_type IN ('job', 'supplier', 'install_tip', 'pricing', 'mistake', 'idea', 'general')),
  tags text[],
  visibility text CHECK (visibility IN ('private', 'company', 'public')) DEFAULT 'private',
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_user ON public.knowledge_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_company ON public.knowledge_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_search ON public.knowledge_notes USING gin(to_tsvector('english', content));

-- Enable RLS
ALTER TABLE public.knowledge_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users see own notes" ON public.knowledge_notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users see company notes" ON public.knowledge_notes
  FOR SELECT USING (
    visibility = 'company' AND 
    company_id IN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users create own notes" ON public.knowledge_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own notes" ON public.knowledge_notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users delete own notes" ON public.knowledge_notes
  FOR DELETE USING (user_id = auth.uid());