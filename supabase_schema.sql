-- ============================================================
-- GenZ Mind — Supabase Database Schema (Idempotent / Safe to re-run)
-- Run this in your Supabase project: SQL Editor > New Query
-- ============================================================

-- ─── PROFILES TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ─── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    role = CASE WHEN profiles.role IS NULL THEN EXCLUDED.role ELSE profiles.role END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also backfill any existing users in auth.users that don't have a profile yet!
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  COALESCE(email, ''), 
  COALESCE(raw_user_meta_data->>'full_name', 'Student'), 
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ─── QUIZZES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course               TEXT NOT NULL,
  topic                TEXT NOT NULL,
  difficulty           TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  quiz_type            TEXT NOT NULL CHECK (quiz_type IN ('mcq', 'true_false', 'short_answer', 'mixed')),
  number_of_questions  INT NOT NULL,
  questions            JSONB NOT NULL DEFAULT '[]',
  google_form_url      TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own quizzes" ON public.quizzes;
CREATE POLICY "Users can manage own quizzes"
  ON public.quizzes FOR ALL
  USING (auth.uid() = user_id);


-- ─── QUIZ RESULTS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id          UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score            INT NOT NULL,
  total_questions  INT NOT NULL,
  percentage       NUMERIC(5, 2) NOT NULL,
  answers          JSONB NOT NULL DEFAULT '[]',
  completed_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can manage own results" ON public.quiz_results;
CREATE POLICY "Students can manage own results"
  ON public.quiz_results FOR ALL
  USING (auth.uid() = student_id);


-- ─── ASSIGNMENTS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course           TEXT NOT NULL,
  topic            TEXT NOT NULL,
  student_level    TEXT NOT NULL CHECK (student_level IN ('beginner', 'intermediate', 'advanced')),
  assignment_type  TEXT NOT NULL,
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  content          JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors can manage own assignments" ON public.assignments;
CREATE POLICY "Instructors can manage own assignments"
  ON public.assignments FOR ALL
  USING (auth.uid() = instructor_id);


-- ─── DOCUMENTS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);


-- ─── UPDATED_AT TRIGGER HELPER ────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_assignments_updated_at ON public.assignments;
CREATE TRIGGER set_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
