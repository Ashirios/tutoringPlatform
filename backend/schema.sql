-- =============================================
-- SAT Tutoring Platform — Supabase SQL Schema
-- =============================================

-- 1. profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user'
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. question_bank
CREATE TABLE IF NOT EXISTS public.question_bank (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  answer   text NOT NULL CHECK (answer IN ('a', 'b', 'c', 'd')),
  type     text NOT NULL CHECK (type IN ('math', 'reading'))
);

-- 3. lms (learning materials)
CREATE TABLE IF NOT EXISTS public.lms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  link        text
);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms           ENABLE ROW LEVEL SECURITY;

-- profiles: user sees only own row
CREATE POLICY "own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- question_bank: anyone authenticated can read
CREATE POLICY "read questions" ON public.question_bank
  FOR SELECT USING (auth.role() = 'authenticated');

-- lms: anyone authenticated can read
CREATE POLICY "read lms" ON public.lms
  FOR SELECT USING (auth.role() = 'authenticated');

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- lms: admin full access
CREATE POLICY "admin insert lms" ON public.lms
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admin update lms" ON public.lms
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admin delete lms" ON public.lms
  FOR DELETE USING (public.is_admin());

-- question_bank: admin full access
CREATE POLICY "admin insert questions" ON public.question_bank
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admin update questions" ON public.question_bank
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admin delete questions" ON public.question_bank
  FOR DELETE USING (public.is_admin());

-- profiles: admin can view all profiles
CREATE POLICY "admin select profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
