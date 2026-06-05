-- MindPrompt — Initial Schema
-- Run this against your Supabase project via the SQL editor or psql.
-- Prerequisites: the uuid-ossp extension (enabled by default on Supabase).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Prompt history ───────────────────────────────────────────────────────────
-- One row per optimization. Keyed by a SHA-256 hash of the user's Gemini API
-- key so history is per-user without requiring accounts.

CREATE TABLE IF NOT EXISTS prompt_history (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_hash             TEXT NOT NULL,
    original_text        TEXT NOT NULL,
    optimized_text       TEXT NOT NULL,
    model_used           TEXT,
    token_count_original INTEGER,
    token_count_optimized INTEGER,
    readability_original FLOAT,
    readability_optimized FLOAT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_key_hash
    ON prompt_history(key_hash);

CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at
    ON prompt_history(created_at DESC);

-- ─── Legacy / future tables ───────────────────────────────────────────────────
-- These are kept for reference. The JWT-based account system is not active in
-- the current version but the schema is preserved for future use.

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- Supabase auth integration tables (used when Supabase Auth is enabled)
CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    username   TEXT,
    full_name  TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.prompts (
    id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID REFERENCES public.profiles(id),
    original_text TEXT NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
    id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prompt_id                 UUID REFERENCES public.prompts(id) NOT NULL,
    optimized_text            TEXT NOT NULL,
    model_used                TEXT,
    token_savings_percent     NUMERIC,
    readability_score_original NUMERIC,
    readability_score_optimized NUMERIC,
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
