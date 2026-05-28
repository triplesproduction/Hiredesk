-- Supabase Schema for HireDesk Candidates Table
-- Paste this script into your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query) and click Run.

-- 1. Create the candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  score JSONB NOT NULL, -- Contains skills, exp, edu, completeness, total
  status TEXT NOT NULL DEFAULT 'new',
  city TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  exp TEXT NOT NULL,
  education TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  "resumeFile" TEXT NOT NULL,
  "resumeUrl" TEXT,
  "resumeText" TEXT,
  "appliedAt" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

-- 2. Create performance indexing for fast filter scanning
CREATE INDEX IF NOT EXISTS idx_candidates_role_id ON public.candidates("roleId");
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates("createdAt" DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 4. Create policies to allow public anon read/write access (standard for simple client-side apps using the anon key)
DROP POLICY IF EXISTS "Allow public read" ON public.candidates;
CREATE POLICY "Allow public read" ON public.candidates 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.candidates;
CREATE POLICY "Allow public insert" ON public.candidates 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.candidates;
CREATE POLICY "Allow public update" ON public.candidates 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.candidates;
CREATE POLICY "Allow public delete" ON public.candidates 
  FOR DELETE USING (true);
