-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.line_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid,
  line_number integer NOT NULL CHECK (line_number = ANY (ARRAY[1, 2, 3])),
  match_type text NOT NULL CHECK (match_type = ANY (ARRAY['singles'::text, 'doubles'::text])),
  home_player_1_id uuid,
  home_player_2_id uuid,
  away_player_1_id uuid,
  away_player_2_id uuid,
  home_set_1 integer,
  away_set_1 integer,
  home_set_2 integer,
  away_set_2 integer,
  home_set_3 integer,
  away_set_3 integer,
  home_won boolean,
  submitted_by uuid,
  submitted_at timestamp with time zone DEFAULT now(),
  notes text,
  CONSTRAINT line_results_pkey PRIMARY KEY (id),
  CONSTRAINT line_results_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id),
  CONSTRAINT line_results_home_player_1_id_fkey FOREIGN KEY (home_player_1_id) REFERENCES public.player(id),
  CONSTRAINT line_results_home_player_2_id_fkey FOREIGN KEY (home_player_2_id) REFERENCES public.player(id),
  CONSTRAINT line_results_away_player_1_id_fkey FOREIGN KEY (away_player_1_id) REFERENCES public.player(id),
  CONSTRAINT line_results_away_player_2_id_fkey FOREIGN KEY (away_player_2_id) REFERENCES public.player(id),
  CONSTRAINT line_results_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id)
);
CREATE TABLE public.match (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  winning_team uuid,
  match_date timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  team_1_points smallint,
  team_2_points smallint,
  CONSTRAINT match_pkey PRIMARY KEY (id),
  CONSTRAINT match_winning_team_fkey FOREIGN KEY (winning_team) REFERENCES public.team(id)
);
CREATE TABLE public.match_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid UNIQUE,
  home_lines_won integer DEFAULT 0,
  away_lines_won integer DEFAULT 0,
  home_total_games integer DEFAULT 0,
  away_total_games integer DEFAULT 0,
  home_won boolean,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT match_scores_pkey PRIMARY KEY (id),
  CONSTRAINT match_scores_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id)
);
CREATE TABLE public.match_to_team_match (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match uuid NOT NULL,
  team_match uuid,
  CONSTRAINT match_to_team_match_pkey PRIMARY KEY (id),
  CONSTRAINT match_to_team_match_match_fkey FOREIGN KEY (match) REFERENCES public.match(id),
  CONSTRAINT match_to_team_match_team_match_fkey FOREIGN KEY (team_match) REFERENCES public.team_match(id)
);
CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  week integer NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  courts text NOT NULL,
  home_team_number integer NOT NULL,
  home_team_name text NOT NULL,
  home_team_night text NOT NULL,
  away_team_number integer NOT NULL,
  away_team_name text NOT NULL,
  away_team_night text NOT NULL,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'postponed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT matches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.player (
  id uuid NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  ranking smallint NOT NULL DEFAULT '3'::smallint,
  created_at timestamp with time zone DEFAULT now(),
  is_captain boolean NOT NULL DEFAULT false,
  email text NOT NULL,
  phone text,
  notes text,
  is_active boolean NOT NULL DEFAULT true CHECK (is_active = ANY (ARRAY[true, false])),
  is_admin boolean DEFAULT false,
  CONSTRAINT player_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.player_to_match (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player uuid,
  match uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT player_to_match_pkey PRIMARY KEY (id),
  CONSTRAINT player_to_match_match_fkey FOREIGN KEY (match) REFERENCES public.match(id),
  CONSTRAINT player_to_match_player_fkey FOREIGN KEY (player) REFERENCES public.player(id)
);
CREATE TABLE public.player_to_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player uuid NOT NULL DEFAULT auth.uid(),
  team uuid,
  CONSTRAINT player_to_team_pkey PRIMARY KEY (id),
  CONSTRAINT player_to_team_player_fkey FOREIGN KEY (player) REFERENCES public.player(id),
  CONSTRAINT player_to_team_team_fkey FOREIGN KEY (team) REFERENCES public.team(id)
);
CREATE TABLE public.season (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number smallint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  year smallint NOT NULL,
  season_start date NOT NULL,
  season_end date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT season_pkey PRIMARY KEY (id)
);
CREATE TABLE public.set (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  set_number smallint,
  team_1_games smallint,
  team_2_games smallint,
  team_1_tiebreak_points smallint,
  team_2_tiebreak_points smallint,
  CONSTRAINT set_pkey PRIMARY KEY (id)
);
CREATE TABLE public.set_to_match (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  set uuid,
  match uuid,
  CONSTRAINT set_to_match_pkey PRIMARY KEY (id),
  CONSTRAINT set_to_match_match_fkey FOREIGN KEY (match) REFERENCES public.match(id),
  CONSTRAINT set_to_match_set_fkey FOREIGN KEY (set) REFERENCES public.set(id)
);
CREATE TABLE public.team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number smallint,
  name character varying NOT NULL,
  play_night USER-DEFINED,
  CONSTRAINT team_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_match (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  team_1 uuid,
  team_2 uuid,
  winner uuid,
  team_1_points smallint,
  team_2_points smallint,
  season_id uuid,
  CONSTRAINT team_match_pkey PRIMARY KEY (id),
  CONSTRAINT team_match_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.season(id),
  CONSTRAINT team_match_team_1_fkey FOREIGN KEY (team_1) REFERENCES public.team(id),
  CONSTRAINT team_match_team_2_fkey FOREIGN KEY (team_2) REFERENCES public.team(id),
  CONSTRAINT team_match_winner_fkey FOREIGN KEY (winner) REFERENCES public.team(id)
);
CREATE TABLE public.team_to_season (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team uuid,
  season uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_to_season_pkey PRIMARY KEY (id),
  CONSTRAINT team_to_season_season_fkey FOREIGN KEY (season) REFERENCES public.season(id),
  CONSTRAINT team_to_season_team_fkey FOREIGN KEY (team) REFERENCES public.team(id)
);
