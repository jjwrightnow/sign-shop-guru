-- Create app_role enum for role types
CREATE TYPE public.app_role AS ENUM ('platform_admin', 'company_admin', 'expert', 'user');

-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'trial', 'pro', 'enterprise')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create expert_knowledge table
CREATE TABLE public.expert_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global', 'company')),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  topic text NOT NULL,
  question_pattern text,
  knowledge_text text NOT NULL,
  knowledge_type text CHECK (knowledge_type IN ('correction', 'addition', 'verification')),
  expert_id uuid REFERENCES auth.users(id),
  upvotes integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for expert_knowledge
CREATE INDEX idx_expert_knowledge_company ON public.expert_knowledge(company_id);
CREATE INDEX idx_expert_knowledge_scope ON public.expert_knowledge(scope);
CREATE INDEX idx_expert_knowledge_topic ON public.expert_knowledge USING gin(to_tsvector('english', topic));

-- Create ai_response_feedback table
CREATE TABLE public.ai_response_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES public.companies(id),
  feedback_type text CHECK (feedback_type IN ('correct', 'incorrect', 'needs_context')),
  correction_text text,
  reviewed_by uuid REFERENCES auth.users(id),
  applied_to_knowledge boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_feedback ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user belongs to a company
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user has role in specific company
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid, _company_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = ANY(_roles)
  )
$$;

-- Companies RLS policies
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (
    id = public.get_user_company_id(auth.uid())
  );

CREATE POLICY "Platform admin can view all companies" ON public.companies
  FOR SELECT USING (
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Platform admin can insert companies" ON public.companies
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Platform admin can update companies" ON public.companies
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Platform admin can delete companies" ON public.companies
  FOR DELETE USING (
    public.has_role(auth.uid(), 'platform_admin')
  );

-- User roles RLS policies
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Company admin can view team roles" ON public.user_roles
  FOR SELECT USING (
    public.has_company_role(auth.uid(), company_id, ARRAY['company_admin'::app_role])
  );

CREATE POLICY "Platform admin can manage all roles" ON public.user_roles
  FOR ALL USING (
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Company admin can manage team roles" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.has_company_role(auth.uid(), company_id, ARRAY['company_admin'::app_role])
    AND role IN ('expert', 'user')
  );

CREATE POLICY "Company admin can update team roles" ON public.user_roles
  FOR UPDATE USING (
    public.has_company_role(auth.uid(), company_id, ARRAY['company_admin'::app_role])
    AND role IN ('expert', 'user')
  );

-- Expert knowledge RLS policies
CREATE POLICY "Users can view global and own company knowledge" ON public.expert_knowledge
  FOR SELECT USING (
    scope = 'global' OR 
    company_id = public.get_user_company_id(auth.uid()) OR
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Experts can insert for own company" ON public.expert_knowledge
  FOR INSERT WITH CHECK (
    public.has_company_role(auth.uid(), company_id, ARRAY['expert'::app_role, 'company_admin'::app_role]) OR
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Experts can update own knowledge" ON public.expert_knowledge
  FOR UPDATE USING (
    expert_id = auth.uid() OR
    public.has_company_role(auth.uid(), company_id, ARRAY['company_admin'::app_role]) OR
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Platform admin can delete knowledge" ON public.expert_knowledge
  FOR DELETE USING (
    public.has_role(auth.uid(), 'platform_admin')
  );

-- AI response feedback RLS policies
CREATE POLICY "Users can view own feedback" ON public.ai_response_feedback
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.has_company_role(auth.uid(), company_id, ARRAY['company_admin'::app_role]) OR
    public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Users can insert feedback" ON public.ai_response_feedback
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Reviewers can update feedback" ON public.ai_response_feedback
  FOR UPDATE USING (
    public.has_company_role(auth.uid(), company_id, ARRAY['expert'::app_role, 'company_admin'::app_role]) OR
    public.has_role(auth.uid(), 'platform_admin')
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_expert_knowledge_updated_at
  BEFORE UPDATE ON public.expert_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();