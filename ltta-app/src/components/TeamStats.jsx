  import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/TeamStats.css';

export const TeamStats = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');

  // Team-level stats
  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0 });
  const [teamLineStats, setTeamLineStats] = useState({ linesWon: 0, linesLost: 0, gamesWon: 0, gamesLost: 0 });
  const [recentMatches, setRecentMatches] = useState([]);

  // Player-level stats
  const [playerStats, setPlayerStats] = useState([]);

  useEffect(() => {
    loadTeamStatsData();
  }, []);

  const loadTeamStatsData = async () => {
    try {
      setLoading(true);

      // Get current user and verify captain status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      setUser(currentUser);

      const { data: playerData, error: playerError } = await supabase
        .from('player')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (playerError || !playerData?.is_captain) {
        throw new Error('Access denied: Captain privileges required');
      }

      // Get team data
      const { data: teamLink, error: teamLinkError } = await supabase
        .from('player_to_team')
        .select('team')
        .eq('player', currentUser.id)
        .single();

      if (teamLinkError) throw teamLinkError;

      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('*')
        .eq('id', teamLink.team)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      const rosterData = await loadTeamRoster(teamData.id);

      const matches = await fetchTeamMatches(teamData.number);
      const matchIds = matches.map((match) => match.id);

      const [matchScores, lineResults] = await Promise.all([
        fetchMatchScores(matchIds),
        fetchLineResults(matchIds)
      ]);

      loadTeamRecordFromScores(matches, matchScores, teamData.number);
      loadTeamLineStatsFromScores(matchScores, matches, teamData.number);
      loadRecentMatchesFromList(matches, matchScores, teamData.number);
      loadPlayerStatsFromLines(rosterData, matches, lineResults, teamData.number);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamRoster = async (teamId) => {
    try {
      const { data: teamPlayers, error } = await supabase
        .from('player_to_team')
        .select(`
          player:player(
            id,
            first_name,
            last_name,
            email,
            ranking,
            is_captain
          )
        `)
        .eq('team', teamId);

      if (error) throw error;

      const rosterData = (teamPlayers || []).map((tp) => tp.player);
      setRoster(rosterData);
      return rosterData;
    } catch (err) {
      console.error('Error loading roster:', err);
      return [];
    }
  };

  const fetchTeamMatches = async (teamNumber) => {
    if (!teamNumber) return [];

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`home_team_number.eq.${teamNumber},away_team_number.eq.${teamNumber}`)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const fetchMatchScores = async (matchIds) => {
    if (!matchIds.length) return [];

    const { data, error } = await supabase
      .from('match_scores')
      .select('match_id, home_lines_won, away_lines_won, home_total_games, away_total_games, home_won')
      .in('match_id', matchIds);

    if (error) throw error;
    return data || [];
  };

  const fetchLineResults = async (matchIds) => {
    if (!matchIds.length) return [];

    const { data, error } = await supabase
      .from('line_results')
      .select('match_id, match_type, home_player_1_id, home_player_2_id, away_player_1_id, away_player_2_id, home_set_1, away_set_1, home_set_2, away_set_2, home_set_3, away_set_3, home_won')
      .in('match_id', matchIds);

    if (error) throw error;
    return data || [];
  };

  const loadTeamRecordFromScores = (matches, matchScores, teamNumber) => {
    const scoreMap = new Map(matchScores.map((score) => [score.match_id, score]));

    let wins = 0;
    let losses = 0;

    matches.forEach((match) => {
      const score = scoreMap.get(match.id);
      if (!score) return;

      const isHome = match.home_team_number === teamNumber;

      let teamWon;
      if (typeof score.home_won === 'boolean') {
        teamWon = isHome ? score.home_won : !score.home_won;
      } else {
        const teamLines = isHome ? (score.home_lines_won ?? 0) : (score.away_lines_won ?? 0);
        const oppLines = isHome ? (score.away_lines_won ?? 0) : (score.home_lines_won ?? 0);
        if (teamLines === oppLines) return;
        teamWon = teamLines > oppLines;
      }

      if (teamWon) wins += 1;
      else losses += 1;
    });

    setTeamRecord({ wins, losses });
  };

  const loadTeamLineStatsFromScores = (matchScores, matches, teamNumber) => {
    const matchMap = new Map(matches.map((match) => [match.id, match]));

    let linesWon = 0;
    let linesLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    matchScores.forEach((score) => {
      const match = matchMap.get(score.match_id);
      if (!match) return;

      const isHome = match.home_team_number === teamNumber;

      if (isHome) {
        linesWon += score.home_lines_won || 0;
        linesLost += score.away_lines_won || 0;
        gamesWon += score.home_total_games || 0;
        gamesLost += score.away_total_games || 0;
      } else {
        linesWon += score.away_lines_won || 0;
        linesLost += score.home_lines_won || 0;
        gamesWon += score.away_total_games || 0;
        gamesLost += score.home_total_games || 0;
      }
    });

    setTeamLineStats({ linesWon, linesLost, gamesWon, gamesLost });
  };

  const loadRecentMatchesFromList = (matches, matchScores, teamNumber) => {
    const scoreMap = new Map(matchScores.map((score) => [score.match_id, score]));
    const recent = matches.slice(0, 10).map((match) => {
      const score = scoreMap.get(match.id);

      let teamLines = null;
      let opponentLines = null;
      let teamGames = null;
      let opponentGames = null;
      let teamWon = null;

      if (score) {
        const isHome = match.home_team_number === teamNumber;
        teamLines = isHome ? score.home_lines_won ?? null : score.away_lines_won ?? null;
        opponentLines = isHome ? score.away_lines_won ?? null : score.home_lines_won ?? null;
        teamGames = isHome ? score.home_total_games ?? null : score.away_total_games ?? null;
        opponentGames = isHome ? score.away_total_games ?? null : score.home_total_games ?? null;

        if (typeof score.home_won === 'boolean') {
          teamWon = isHome ? score.home_won : !score.home_won;
        } else if (teamLines !== null && opponentLines !== null && teamLines !== opponentLines) {
          teamWon = teamLines > opponentLines;
        } else if (teamGames !== null && opponentGames !== null && teamGames !== opponentGames) {
          teamWon = teamGames > opponentGames;
        }
      }

      return {
        ...match,
        teamLines,
        opponentLines,
        teamGames,
        opponentGames,
        teamWon
      };
    });

    setRecentMatches(recent);
  };

  const loadPlayerStatsFromLines = (rosterData, matches, lineResults, teamNumber) => {
    const matchMap = new Map(matches.map((match) => [match.id, match]));
    const playerStatsMap = new Map();

    rosterData.forEach((player) => {
      playerStatsMap.set(player.id, {
        ...player,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        singlesRecord: { wins: 0, losses: 0 },
        doublesRecord: { wins: 0, losses: 0 }
      });
    });

    lineResults.forEach((line) => {
      const match = matchMap.get(line.match_id);
      if (!match) return;

      const isHomeTeam = match.home_team_number === teamNumber;
      const playerIds = [];

      if (isHomeTeam) {
        if (line.home_player_1_id) playerIds.push(line.home_player_1_id);
        if (line.home_player_2_id) playerIds.push(line.home_player_2_id);
      } else {
        if (line.away_player_1_id) playerIds.push(line.away_player_1_id);
        if (line.away_player_2_id) playerIds.push(line.away_player_2_id);
      }

      const sets = [
        { home: line.home_set_1, away: line.away_set_1 },
        { home: line.home_set_2, away: line.away_set_2 },
        { home: line.home_set_3, away: line.away_set_3 }
      ].filter((set) => set.home !== null && set.home !== undefined && set.away !== null && set.away !== undefined);

      let setsWon = 0;
      let setsLost = 0;
      let gamesWon = 0;
      let gamesLost = 0;

      sets.forEach((set) => {
        if (isHomeTeam) {
          gamesWon += set.home || 0;
          gamesLost += set.away || 0;
          if ((set.home || 0) > (set.away || 0)) setsWon++;
          else setsLost++;
        } else {
          gamesWon += set.away || 0;
          gamesLost += set.home || 0;
          if ((set.away || 0) > (set.home || 0)) setsWon++;
          else setsLost++;
        }
      });

      let teamWon;
      if (typeof line.home_won === 'boolean') {
        teamWon = isHomeTeam ? line.home_won : !line.home_won;
      } else if (gamesWon !== gamesLost) {
        teamWon = gamesWon > gamesLost;
      } else {
        teamWon = setsWon > setsLost;
      }

      playerIds.forEach((playerId) => {
        const stats = playerStatsMap.get(playerId);
        if (!stats) return;

        stats.matchesPlayed += 1;
        stats.setsWon += setsWon;
        stats.setsLost += setsLost;
        stats.gamesWon += gamesWon;
        stats.gamesLost += gamesLost;

        if (teamWon) stats.wins += 1;
        else stats.losses += 1;

        if (line.match_type === 'singles') {
          if (teamWon) stats.singlesRecord.wins += 1;
          else stats.singlesRecord.losses += 1;
        } else {
          if (teamWon) stats.doublesRecord.wins += 1;
          else stats.doublesRecord.losses += 1;
        }
      });
    });

    setPlayerStats(Array.from(playerStatsMap.values()));
  };

  if (loading) {
    return <div className="team-stats loading">Loading team statistics...</div>;
  }

  if (error) {
    return <div className="team-stats error">{error}</div>;
  }

  const winPercentage = teamRecord.wins + teamRecord.losses > 0 
    ? ((teamRecord.wins / (teamRecord.wins + teamRecord.losses)) * 100).toFixed(1)
    : '0.0';

  const lineWinPercentage = teamLineStats.linesWon + teamLineStats.linesLost > 0
    ? ((teamLineStats.linesWon / (teamLineStats.linesWon + teamLineStats.linesLost)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="team-stats">
      <div className="team-stats-header">
        <h1>Team Statistics</h1>
        <p>Comprehensive performance analytics for your team and players.</p>
      </div>

      {team && (
        <div className="team-banner card card--interactive card--overlay">
          <div className="team-emblem">📊</div>
          <div className="team-meta-block">
            <span className="team-meta-label">Statistics for</span>
            <span className="team-meta-name">Team {team.number} · {team.name}</span>
            <span className="team-meta-info">{team.play_night} Night League • {roster.length} Players</span>
          </div>
        </div>
      )}

      <div className="stats-overview">
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Match Record</div>
          <div className="stat-value">{teamRecord.wins} - {teamRecord.losses}</div>
          <div className="stat-subtitle">{winPercentage}% Win Rate</div>
        </div>
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Line Record</div>
          <div className="stat-value">{teamLineStats.linesWon} - {teamLineStats.linesLost}</div>
          <div className="stat-subtitle">{lineWinPercentage}% Line Win Rate</div>
        </div>
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Games Record</div>
          <div className="stat-value">{teamLineStats.gamesWon} - {teamLineStats.gamesLost}</div>
          <div className="stat-subtitle">
            {teamLineStats.gamesWon + teamLineStats.gamesLost > 0 
              ? `${((teamLineStats.gamesWon / (teamLineStats.gamesWon + teamLineStats.gamesLost)) * 100).toFixed(1)}%`
              : '0.0%'} Games Won
          </div>
        </div>
        <div className="stat-card card card--interactive card--overlay">
          <div className="stat-label">Matches Played</div>
          <div className="stat-value">{teamRecord.wins + teamRecord.losses}</div>
          <div className="stat-subtitle">This Season</div>
        </div>
      </div>

      <div className="stats-sections">
        <section className="stats-section card card--interactive">
          <div className="section-header">
            <h2>Player Performance</h2>
            <p>Individual statistics for each team member.</p>
          </div>
          <div className="player-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Rank</th>
                  <th>Matches</th>
                  <th>Record</th>
                  <th>Win %</th>
                  <th>Singles</th>
                  <th>Doubles</th>
                  <th>Games</th>
                </tr>
              </thead>
              <tbody>
                {playerStats
                  .sort((a, b) => (b.wins / Math.max(1, b.wins + b.losses)) - (a.wins / Math.max(1, a.wins + a.losses)))
                  .map((player) => {
                    const winPct = player.wins + player.losses > 0 
                      ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <tr key={player.id}>
                        <td>
                          <div className="player-name">
                            {player.first_name} {player.last_name}
                            {player.is_captain && <span className="captain-badge">👑</span>}
                          </div>
                        </td>
                        <td>#{player.ranking}</td>
                        <td>{player.matchesPlayed}</td>
                        <td>{player.wins} - {player.losses}</td>
                        <td>{winPct}%</td>
                        <td>{player.singlesRecord.wins} - {player.singlesRecord.losses}</td>
                        <td>{player.doublesRecord.wins} - {player.doublesRecord.losses}</td>
                        <td>{player.gamesWon} - {player.gamesLost}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stats-section card card--interactive">
          <div className="section-header">
            <h2>Recent Match History</h2>
            <p>Last 10 matches played by the team.</p>
          </div>
          <div className="recent-matches">
            {recentMatches.length === 0 ? (
              <div className="empty-state">
                <p>No match history available.</p>
              </div>
            ) : (
              recentMatches.map((matchEntry) => {
                const matchDate = new Date(matchEntry.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                const isHomeTeam = matchEntry.home_team_number === team.number;
                const resultClass = matchEntry.teamWon === null ? 'result-pending' : matchEntry.teamWon ? 'result-win' : 'result-loss';

                let scoreDisplay = 'Pending';
                if (matchEntry.teamLines !== null && matchEntry.opponentLines !== null) {
                  scoreDisplay = `${matchEntry.teamLines} - ${matchEntry.opponentLines} Lines`;
                } else if (matchEntry.teamGames !== null && matchEntry.opponentGames !== null) {
                  scoreDisplay = `${matchEntry.teamGames} - ${matchEntry.opponentGames} Games`;
                }

                return (
                  <div key={matchEntry.id} className="match-history-card card card--subtle">
                    <div className="match-date">{matchDate}</div>
                    <div className="match-teams">
                      <span className={isHomeTeam ? 'team-us' : 'team-opponent'}>
                        {matchEntry.home_team_name}
                      </span>
                      <span className="vs-label">vs</span>
                      <span className={!isHomeTeam ? 'team-us' : 'team-opponent'}>
                        {matchEntry.away_team_name}
                      </span>
                    </div>
                    <div className="match-result">
                      <span className={resultClass}>{scoreDisplay}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
