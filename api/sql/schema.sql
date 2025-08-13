
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  grade_level TEXT,
  target_exam TEXT CHECK (target_exam IN ('E','G','other')) DEFAULT 'G',
  locale TEXT DEFAULT 'he-IL'
);
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL CHECK (code IN ('3','4','5')),
  title TEXT NOT NULL
);
INSERT INTO units(code, title) VALUES
  ('3','Unit 3 — Fundamentals'),
  ('4','Unit 4 — Developing Skills'),
  ('5','Unit 5 — Advanced & Exam Skills')
ON CONFLICT (code) DO NOTHING;
CREATE TABLE IF NOT EXISTS user_units (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id INT REFERENCES units(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, unit_id)
);
CREATE TABLE IF NOT EXISTS topics(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id INT REFERENCES units(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('vocab','reading','exams','grammar')),
  title TEXT NOT NULL,
  order_idx INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lessons(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  objective JSONB DEFAULT '[]'::jsonb,
  reading_html TEXT,
  grammar_html TEXT,
  duration_min INT DEFAULT 20
);
CREATE TABLE IF NOT EXISTS exercises(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  qtype TEXT NOT NULL CHECK (qtype IN ('MCQ','Cloze','Transform','Evidence','TFNG')),
  payload JSONB NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','med','hard')) DEFAULT 'med'
);
CREATE TABLE IF NOT EXISTS attempts(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  score NUMERIC,
  time_sec NUMERIC,
  answer_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
