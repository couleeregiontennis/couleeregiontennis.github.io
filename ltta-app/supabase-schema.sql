-- LTTA Score Submission Database Schema
-- Run this in your Supabase SQL editor to create the necessary tables

-- Matches table to store match information
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week INTEGER NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  courts TEXT NOT NULL,
  home_team_number INTEGER NOT NULL,
  home_team_name TEXT NOT NULL,
  home_team_night TEXT NOT NULL, -- 'tuesday' or 'wednesday'
  away_team_number INTEGER NOT NULL,
  away_team_name TEXT NOT NULL,
  away_team_night TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'postponed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual line results within a match
CREATE TABLE IF NOT EXISTS line_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL CHECK (line_number IN (1, 2, 3)),
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles')),
  
  -- Home team players
  home_player_1_id UUID REFERENCES player(id),
  home_player_2_id UUID REFERENCES player(id), -- NULL for singles
  
  -- Away team players  
  away_player_1_id UUID REFERENCES player(id),
  away_player_2_id UUID REFERENCES player(id), -- NULL for singles
  
  -- Score sets (best 2 of 3)
  home_set_1 INTEGER,
  away_set_1 INTEGER,
  home_set_2 INTEGER,
  away_set_2 INTEGER,
  home_set_3 INTEGER, -- 10-point match tiebreak
  away_set_3 INTEGER,
  
  -- Final result
  home_won BOOLEAN,
  
  -- Metadata
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Match scores summary (calculated from line_results)
CREATE TABLE IF NOT EXISTS match_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  home_lines_won INTEGER DEFAULT 0,
  away_lines_won INTEGER DEFAULT 0,
  home_total_games INTEGER DEFAULT 0,
  away_total_games INTEGER DEFAULT 0,
  home_won BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all matches
CREATE POLICY "Allow authenticated users to read matches" ON matches
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert matches (for score submission)
CREATE POLICY "Allow authenticated users to insert matches" ON matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update matches
CREATE POLICY "Allow authenticated users to update matches" ON matches
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for line_results
CREATE POLICY "Allow authenticated users to read line_results" ON line_results
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert line_results" ON line_results
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update line_results" ON line_results
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for match_scores
CREATE POLICY "Allow authenticated users to read match_scores" ON match_scores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert match_scores" ON match_scores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update match_scores" ON match_scores
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to automatically calculate match scores when line results are inserted/updated
CREATE OR REPLACE FUNCTION calculate_match_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate scores for the match
  INSERT INTO match_scores (match_id, home_lines_won, away_lines_won, home_total_games, away_total_games, home_won)
  SELECT 
    NEW.match_id,
    COUNT(CASE WHEN home_won = true THEN 1 END) as home_lines_won,
    COUNT(CASE WHEN home_won = false THEN 1 END) as away_lines_won,
    COALESCE(SUM(home_set_1 + home_set_2 + COALESCE(home_set_3, 0)), 0) as home_total_games,
    COALESCE(SUM(away_set_1 + away_set_2 + COALESCE(away_set_3, 0)), 0) as away_total_games,
    COUNT(CASE WHEN home_won = true THEN 1 END) > COUNT(CASE WHEN home_won = false THEN 1 END) as home_won
  FROM line_results 
  WHERE match_id = NEW.match_id
  ON CONFLICT (match_id) 
  DO UPDATE SET
    home_lines_won = EXCLUDED.home_lines_won,
    away_lines_won = EXCLUDED.away_lines_won,
    home_total_games = EXCLUDED.home_total_games,
    away_total_games = EXCLUDED.away_total_games,
    home_won = EXCLUDED.home_won,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate match scores
CREATE TRIGGER calculate_match_scores_trigger
  AFTER INSERT OR UPDATE ON line_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_match_scores();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_week_date ON matches(week, date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_number, away_team_number);
CREATE INDEX IF NOT EXISTS idx_line_results_match_id ON line_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_match_id ON match_scores(match_id);
