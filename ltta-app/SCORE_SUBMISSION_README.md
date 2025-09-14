# Score Submission System

## Overview

The LTTA app now includes a comprehensive score submission system that allows logged-in users to submit match results and view team standings.

## Features Implemented

### 1. Score Submission Form (`AddScore.jsx`)

- **Team Selection**: Choose home and away teams from Tuesday/Wednesday divisions
- **Match Details**: Date, time, and court assignment
- **Line-by-Line Scoring**:
  - Line 1: Players #1 & #2 (singles or doubles)
  - Line 2: Players #3 & #4 (doubles only)
  - Line 3: Players #5-#8 (doubles only)
- **Set Scoring**: Best 2-out-of-3 sets with optional 10-point tiebreak
- **Player Names**: Optional player identification for each line
- **Validation**: Ensures at least one line has complete scores

### 2. Database Schema (`supabase-schema.sql`)

- **Matches Table**: Stores match information and metadata
- **Line Results Table**: Individual line scores and results
- **Match Scores Table**: Calculated totals and match outcomes
- **Automatic Calculations**: Triggers calculate match scores from line results
- **Row Level Security**: Authenticated users can read/write scores

### 3. Match Results Display (`MatchResults.jsx`)

- **Team Results**: Shows completed matches for each team
- **Win/Loss Record**: Visual indicators for match outcomes
- **Score Summary**: Lines won and total games
- **Responsive Design**: Mobile-friendly table display

### 4. Navigation Integration

- **Standings Link**: Added to main navigation
- **Protected Routes**: Score submission requires authentication
- **Team Page Integration**: Results display on individual team pages

## Database Setup

To enable score submission, run the SQL commands in `supabase-schema.sql` in your Supabase SQL editor:

1. Create the tables (matches, line_results, match_scores)
2. Set up Row Level Security policies
3. Create the automatic calculation trigger

## Usage

### Submitting Scores

1. Log in to the app
2. Navigate to "Add Score" (members only)
3. Select teams and match details
4. Enter scores for each line played
5. Submit the form

### Viewing Results

1. Go to any team page
2. Scroll down to see "Match Results" section
3. View completed matches with win/loss records

### Viewing Standings

1. Click "Standings" in the navigation
2. Filter by night (Tuesday/Wednesday) or view all
3. See team rankings based on performance

## Technical Details

### Form Validation

- Requires at least one complete line of scores
- Validates team selection and match details
- Handles both singles and doubles formats

### Score Calculation

- Automatically determines line winners (best 2 of 3 sets)
- Calculates match totals and outcomes
- Supports 10-point match tiebreaks

### Data Flow

1. User submits scores via AddScore form
2. Match record created in matches table
3. Line results stored in line_results table
4. Match scores calculated automatically via trigger
5. Results displayed on team pages via MatchResults component

## Future Enhancements

- Player profile integration for automatic player selection
- Email notifications for score submissions
- Admin interface for score management
- Tournament bracket generation
- Advanced statistics and analytics
