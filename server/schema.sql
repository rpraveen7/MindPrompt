-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  full_name text,
  updated_at timestamp with time zone
);

-- Prompts table
create table public.prompts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  original_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Versions table (stores the optimized results)
create table public.prompt_versions (
  id uuid default uuid_generate_v4() primary key,
  prompt_id uuid references public.prompts(id) not null,
  optimized_text text not null,
  model_used text,
  token_savings_percent numeric,
  readability_score_original numeric,
  readability_score_optimized numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
