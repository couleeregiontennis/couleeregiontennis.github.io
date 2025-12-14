-- Create a view to calculate team standings on the backend
-- This replaces the client-side calculation in Standings.jsx

CREATE OR REPLACE VIEW standings_view AS
WITH match_details AS (
    SELECT
        m.id AS match_id,
        m.home_team_number,
        m.away_team_number,
        ms.home_total_games,
        ms.away_total_games,
        ms.home_won,
        -- Calculate sets won by home team
        (
            SELECT
                COALESCE(SUM(CASE WHEN home_set_1 > away_set_1 THEN 1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN home_set_2 > away_set_2 THEN 1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN home_set_3 > away_set_3 THEN 1 ELSE 0 END), 0)
            FROM line_results lr
            WHERE lr.match_id = m.id
        ) AS home_sets_won,
        -- Calculate sets won by away team
        (
            SELECT
                COALESCE(SUM(CASE WHEN away_set_1 > home_set_1 THEN 1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN away_set_2 > home_set_2 THEN 1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN away_set_3 > home_set_3 THEN 1 ELSE 0 END), 0)
            FROM line_results lr
            WHERE lr.match_id = m.id
        ) AS away_sets_won
    FROM matches m
    JOIN match_scores ms ON m.id = ms.match_id
    WHERE 
        ms.home_won IS NOT NULL 
        OR ms.home_total_games IS NOT NULL
),
team_match_stats AS (
    -- Home Team Stats
    SELECT
        t.id AS team_id,
        t.number AS team_number,
        t.name AS team_name,
        t.play_night,
        CASE
            WHEN md.home_won = TRUE THEN 1
            WHEN md.home_won IS NULL AND md.home_sets_won > md.away_sets_won THEN 1
            WHEN md.home_won IS NULL AND md.home_sets_won = md.away_sets_won AND md.home_total_games > md.away_total_games THEN 1
            ELSE 0
        END AS is_win,
        CASE
            WHEN md.home_won = FALSE THEN 1
            WHEN md.home_won IS NULL AND md.home_sets_won < md.away_sets_won THEN 1
            WHEN md.home_won IS NULL AND md.home_sets_won = md.away_sets_won AND md.home_total_games < md.away_total_games THEN 1
            ELSE 0
        END AS is_loss,
        CASE
            WHEN md.home_won IS NULL AND md.home_sets_won = md.away_sets_won AND md.home_total_games = md.away_total_games THEN 1
            ELSE 0
        END AS is_tie,
        md.home_sets_won AS sets_won,
        md.away_sets_won AS sets_lost,
        COALESCE(md.home_total_games, 0) AS games_won,
        COALESCE(md.away_total_games, 0) AS games_lost
    FROM team t
    JOIN match_details md ON t.number = md.home_team_number

    UNION ALL

    -- Away Team Stats
    SELECT
        t.id AS team_id,
        t.number AS team_number,
        t.name AS team_name,
        t.play_night,
        CASE
            WHEN md.home_won = FALSE THEN 1
            WHEN md.home_won IS NULL AND md.away_sets_won > md.home_sets_won THEN 1
            WHEN md.home_won IS NULL AND md.away_sets_won = md.home_sets_won AND md.away_total_games > md.home_total_games THEN 1
            ELSE 0
        END AS is_win,
        CASE
            WHEN md.home_won = TRUE THEN 1
            WHEN md.home_won IS NULL AND md.away_sets_won < md.home_sets_won THEN 1
            WHEN md.home_won IS NULL AND md.away_sets_won = md.home_sets_won AND md.away_total_games < md.home_total_games THEN 1
            ELSE 0
        END AS is_loss,
        CASE
            WHEN md.home_won IS NULL AND md.away_sets_won = md.home_sets_won AND md.away_total_games = md.home_total_games THEN 1
            ELSE 0
        END AS is_tie,
        md.away_sets_won AS sets_won,
        md.home_sets_won AS sets_lost,
        COALESCE(md.away_total_games, 0) AS games_won,
        COALESCE(md.home_total_games, 0) AS games_lost
    FROM team t
    JOIN match_details md ON t.number = md.away_team_number
)
SELECT
    team_id,
    team_number,
    team_name,
    play_night,
    SUM(is_win) AS wins,
    SUM(is_loss) AS losses,
    SUM(is_tie) AS ties,
    COUNT(*) AS matches_played,
    SUM(sets_won) AS sets_won,
    SUM(sets_lost) AS sets_lost,
    SUM(games_won) AS games_won,
    SUM(games_lost) AS games_lost,
    CASE WHEN COUNT(*) > 0 THEN ROUND((SUM(is_win)::numeric / COUNT(*)) * 100, 1) ELSE 0 END AS win_percentage,
    CASE WHEN (SUM(sets_won) + SUM(sets_lost)) > 0 THEN ROUND((SUM(sets_won)::numeric / (SUM(sets_won) + SUM(sets_lost))) * 100, 1) ELSE 0 END AS set_win_percentage
FROM team_match_stats
GROUP BY team_id, team_number, team_name, play_night;
