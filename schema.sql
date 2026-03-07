-- ============================================
-- Stream Haven V2 - Supabase Database Schema
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ACCOUNTS TABLE
CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7c3aed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 3. STREAMS TABLE
CREATE TABLE public.streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT false,
  platform TEXT DEFAULT 'twitch',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streams" ON public.streams
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streams" ON public.streams
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streams" ON public.streams
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own streams" ON public.streams
  FOR DELETE USING (auth.uid() = user_id);

-- 4. CONTENT PLANNER TABLE
CREATE TABLE public.content_planner (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stream', 'video', 'short', 'post')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'planning', 'recording', 'editing', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.content_planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content" ON public.content_planner
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content" ON public.content_planner
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content" ON public.content_planner
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content" ON public.content_planner
  FOR DELETE USING (auth.uid() = user_id);

-- 5. GOALS TABLE
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  target INTEGER NOT NULL,
  current INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- 6. SIMS GOALS TABLE
CREATE TABLE public.sims_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sims_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sims goals" ON public.sims_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sims goals" ON public.sims_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sims goals" ON public.sims_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sims goals" ON public.sims_goals
  FOR DELETE USING (auth.uid() = user_id);

-- 7. IDEAS TABLE
CREATE TABLE public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas" ON public.ideas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id);

-- 8. QUICK LINKS TABLE
CREATE TABLE public.quick_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own links" ON public.quick_links
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links" ON public.quick_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON public.quick_links
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON public.quick_links
  FOR DELETE USING (auth.uid() = user_id);

-- 9. GROWTH STATS TABLE
CREATE TABLE public.growth_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  twitch INTEGER DEFAULT 0,
  youtube INTEGER DEFAULT 0,
  tiktok INTEGER DEFAULT 0,
  instagram INTEGER DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.growth_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own growth stats" ON public.growth_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own growth stats" ON public.growth_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own growth stats" ON public.growth_stats
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own growth stats" ON public.growth_stats
  FOR DELETE USING (auth.uid() = user_id);

-- 10. USER SETTINGS TABLE
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  current_account_id UUID REFERENCES public.accounts ON DELETE SET NULL,
  pastel_theme TEXT DEFAULT 'lavender',
  theme_mode TEXT DEFAULT 'dark',
  onboarding_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create profile, account, settings on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  -- Create default account
  INSERT INTO public.accounts (user_id, name, color)
  VALUES (NEW.id, 'Main Account', '#7c3aed')
  RETURNING id INTO new_account_id;

  -- Create user settings
  INSERT INTO public.user_settings (user_id, current_account_id, pastel_theme, theme_mode)
  VALUES (NEW.id, new_account_id, 'lavender', 'dark');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
