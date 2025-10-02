import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/Style.css';
import '../styles/Standings.css';

const Standings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [standings, setStandings] = useState([]);
  const [nightFilter, setNightFilter] = useState('All');
  const [nightOptions, setNightOptions] = useState(['All']);
  const [lastUpdated, setLastUpdated] = useState('');
  const [nightHighlights, setNightHighlights] = useState({ tuesday: null, wednesday: null });
  const [userTeamId, setUserTeamId] = useState(null);
  const [userTeamNumber, setUserTeamNumber] = useState(null);
  const [userTeamStanding, setUserTeamStanding] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasUserTeam, setHasUserTeam] = useState(false);

  const fetchStandings = useCallback(async () => {
    const valueExists = (value) => value !== null && value !== undefined;

    try {
      setLoading(true);
      setError('');

      const [{ data: teams, error: teamsError }, { data: matches, error: matchesError }] = await Promise.all([
        supabase.from('team').select('*').order('number'),
        supabase
          .from('matches')
          .select(`
            *,
            match_scores (
              home_lines_won,
              away_lines_won,
              home_total_games,
              away_total_games,
              home_won
            ),
            line_results (
              line_number,
              home_set_1,
              away_set_1,
              home_set_2,
              away_set_2,
              home_set_3,
              away_set_3
            )
          `)
      ]);

      if (teamsError) throw teamsError;
      if (matchesError) throw matchesError;

      const standingsData = (teams || []).map((team) => {
        const teamNumber = Number(team.number);
        const teamMatches = (matches || []).filter((match) => {
          const homeNumber = Number(match.home_team_number);
          const awayNumber = Number(match.away_team_number);
          return homeNumber === teamNumber || awayNumber === teamNumber;
        });

        let wins = 0;
        let losses = 0;
        let ties = 0;
        let matchesPlayed = 0;
        let setsWon = 0;
        let setsLost = 0;
        let gamesWon = 0;
        let gamesLost = 0;

        teamMatches.forEach((match) => {
          const rawScore = match.match_scores;
          const score = Array.isArray(rawScore) ? rawScore[0] : rawScore;
          if (!score) return;

          const hasOutcomeData =
            typeof score.home_won === 'boolean' ||
            valueExists(score.home_lines_won) ||
            valueExists(score.home_total_games);

          if (!hasOutcomeData) return;

          const isHomeTeam = Number(match.home_team_number) === teamNumber;
          const teamGamesTotal = isHomeTeam ? score.home_total_games ?? 0 : score.away_total_games ?? 0;
          const opponentGamesTotal = isHomeTeam ? score.away_total_games ?? 0 : score.home_total_games ?? 0;

          let matchSetsWon = 0;
          let matchSetsLost = 0;

          gamesWon += teamGamesTotal;
          gamesLost += opponentGamesTotal;

          const lineResults = Array.isArray(match.line_results) ? match.line_results : [];

          lineResults.forEach((line) => {
            const setScores = [
              { home: line.home_set_1, away: line.away_set_1 },
              { home: line.home_set_2, away: line.away_set_2 },
              { home: line.home_set_3, away: line.away_set_3 }
            ];

            setScores.forEach(({ home, away }) => {
              const homeScore = Number(home);
              const awayScore = Number(away);

              if (
                Number.isNaN(homeScore) ||
                Number.isNaN(awayScore) ||
                (homeScore === 0 && awayScore === 0)
              ) {
                return;
              }

              if (homeScore === awayScore) {
                return;
              }

              const teamWonSet = isHomeTeam ? homeScore > awayScore : awayScore > homeScore;

              if (teamWonSet) {
                matchSetsWon += 1;
              } else {
                matchSetsLost += 1;
              }
            });
          });

          let teamWonMatch = null;

          if (typeof score.home_won === 'boolean') {
            teamWonMatch = isHomeTeam ? score.home_won : !score.home_won;
          } else if (matchSetsWon !== matchSetsLost) {
            teamWonMatch = matchSetsWon > matchSetsLost;
          } else if (teamGamesTotal !== opponentGamesTotal) {
            teamWonMatch = teamGamesTotal > opponentGamesTotal;
          }

          if (teamWonMatch === true) {
            wins += 1;
          } else if (teamWonMatch === false) {
            losses += 1;
          } else {
            ties += 1;
          }

          setsWon += matchSetsWon;
          setsLost += matchSetsLost;

          matchesPlayed += 1;
        });

        const winPct = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
        const setWinPct = setsWon + setsLost > 0 ? (setsWon / (setsWon + setsLost)) * 100 : 0;

        return {
          id: team.id,
          number: team.number,
          name: team.name,
          playNight: team.play_night,
          wins,
          losses,
          ties,
          matchesPlayed,
          setsWon,
          setsLost,
          gamesWon,
          gamesLost,
          winPercentage: winPct,
          setWinPercentage: setWinPct
        };
      });

      const sortedStandings = [...standingsData].sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;

        const setDiffA = a.setsWon - a.setsLost;
        const setDiffB = b.setsWon - b.setsLost;
        if (setDiffB !== setDiffA) return setDiffB - setDiffA;

        const gameDiffA = a.gamesWon - a.gamesLost;
        const gameDiffB = b.gamesWon - b.gamesLost;
        if (gameDiffB !== gameDiffA) return gameDiffB - gameDiffA;

        return Number(a.number) - Number(b.number);
      });

      const uniqueNights = Array.from(
        new Set(sortedStandings.map((team) => team.playNight).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      const findTopTeamForNight = (night) =>
        sortedStandings.find(
          (team) => (team.playNight || '').toLowerCase() === night.toLowerCase()
        ) || null;

      setStandings(sortedStandings);
      setNightOptions(['All', ...uniqueNights]);
      setLastUpdated(new Date().toISOString());
      setNightHighlights({
        tuesday: findTopTeamForNight('tuesday'),
        wednesday: findTopTeamForNight('wednesday')
      });
    } catch (err) {
      console.error('Error loading standings:', err);
      setError('Unable to load standings at this time.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  useEffect(() => {
    let isMounted = true;

    const loadUserTeam = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          if (!isMounted) return;
          setIsAuthenticated(false);
          setHasUserTeam(false);
          setUserTeamId(null);
          setUserTeamNumber(null);
          return;
        }

        if (!isMounted) return;
        setIsAuthenticated(true);

        const { data: teamLink, error: teamLinkError } = await supabase
          .from('player_to_team')
          .select('team ( id, number )')
          .eq('player', user.id)
          .maybeSingle();

        if (teamLinkError) {
          console.error('Error fetching user team:', teamLinkError);
          if (!isMounted) return;
          setHasUserTeam(false);
          setUserTeamId(null);
          setUserTeamNumber(null);
          return;
        }

        if (!isMounted) return;

        if (teamLink?.team) {
          setUserTeamId(teamLink.team.id || null);
          setUserTeamNumber(teamLink.team.number ?? null);
          setHasUserTeam(true);
        } else {
          setHasUserTeam(false);
          setUserTeamId(null);
          setUserTeamNumber(null);
        }
      } catch (err) {
        console.error('Error loading user session:', err);
        if (!isMounted) return;
        setIsAuthenticated(false);
        setHasUserTeam(false);
        setUserTeamId(null);
        setUserTeamNumber(null);
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    loadUserTeam();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!standings.length || (!userTeamId && !userTeamNumber)) {
      setUserTeamStanding(null);
      return;
    }

    const match =
      standings.find((team) => team.id === userTeamId) ||
      standings.find(
        (team) =>
          userTeamNumber !== null && Number(team.number) === Number(userTeamNumber)
      ) ||
      null;

    setUserTeamStanding(match);
  }, [standings, userTeamId, userTeamNumber]);

  useEffect(() => {
    if (nightFilter !== 'All' && !nightOptions.includes(nightFilter)) {
      setNightFilter('All');
    }
  }, [nightOptions, nightFilter]);

  const filteredStandings = useMemo(() => {
    if (nightFilter === 'All') {
      return standings;
    }

    return standings.filter(
      (team) => (team.playNight || '').toLowerCase() === nightFilter.toLowerCase()
    );
  }, [standings, nightFilter]);

  const topTeam = standings[0];

  const formattedUpdatedAt = lastUpdated
    ? new Date(lastUpdated).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : '';

  const shouldShowSpotlight =
    nightHighlights.tuesday ||
    nightHighlights.wednesday ||
    (authChecked && isAuthenticated && hasUserTeam && userTeamStanding);

  return (
    <main className="standings-page">
      <div className="standings-header">
        <h1>Team Standings</h1>
        <p>Live standings generated from recorded match results.</p>
      </div>

      {loading ? (
        <div className="loading-state card card--interactive">
          <p>Loading standings...</p>
        </div>
      ) : error ? (
        <div className="error-state card card--interactive">
          <p>{error}</p>
          <button type="button" className="refresh-btn" onClick={fetchStandings}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="standings-overview">
            {topTeam && (
              <div className="overview-card card card--interactive card--overlay">
                <span className="overview-label">Top Team</span>
                <span className="overview-value">
                  {topTeam.number} · {topTeam.name}
                </span>
                <span className="overview-subtitle">
                  {(topTeam.playNight || 'League').toString()} · {topTeam.winPercentage.toFixed(1)}% win rate
                </span>
              </div>
            )}
          </div>

          {shouldShowSpotlight && (
            <div className="standings-spotlight">
              {nightHighlights.tuesday && (
                <div className="spotlight-card card card--interactive card--overlay">
                  <span className="spotlight-label">Tuesday Leader</span>
                  <div className="spotlight-team">
                    <span className="team-number">Team {nightHighlights.tuesday.number}</span>
                    <span className="team-name">{nightHighlights.tuesday.name}</span>
                  </div>
                  <div className="spotlight-meta">
                    {nightHighlights.tuesday.winPercentage.toFixed(1)}% win rate · {nightHighlights.tuesday.wins}-{nightHighlights.tuesday.losses}
                  </div>
                  <div className="spotlight-stats">
                    <span>Sets {nightHighlights.tuesday.setsWon}-{nightHighlights.tuesday.setsLost}</span>
                    <span>Games {nightHighlights.tuesday.gamesWon}-{nightHighlights.tuesday.gamesLost}</span>
                  </div>
                </div>
              )}
              {nightHighlights.wednesday && (
                <div className="spotlight-card card card--interactive card--overlay">
                  <span className="spotlight-label">Wednesday Leader</span>
                  <div className="spotlight-team">
                    <span className="team-number">Team {nightHighlights.wednesday.number}</span>
                    <span className="team-name">{nightHighlights.wednesday.name}</span>
                  </div>
                  <div className="spotlight-meta">
                    {nightHighlights.wednesday.winPercentage.toFixed(1)}% win rate · {nightHighlights.wednesday.wins}-{nightHighlights.wednesday.losses}
                  </div>
                  <div className="spotlight-stats">
                    <span>Sets {nightHighlights.wednesday.setsWon}-{nightHighlights.wednesday.setsLost}</span>
                    <span>Games {nightHighlights.wednesday.gamesWon}-{nightHighlights.wednesday.gamesLost}</span>
                  </div>
                </div>
              )}
              {authChecked && isAuthenticated && hasUserTeam && userTeamStanding && (
                <div className="spotlight-card card card--interactive card--overlay personal-team">
                  <span className="spotlight-label">Your Team</span>
                  <div className="spotlight-team">
                    <span className="team-number">Team {userTeamStanding.number}</span>
                    <span className="team-name">{userTeamStanding.name}</span>
                  </div>
                  <div className="spotlight-meta">
                    {userTeamStanding.playNight || 'League'} · {userTeamStanding.winPercentage.toFixed(1)}% win rate
                  </div>
                  <div className="spotlight-stats">
                    <span>Record {userTeamStanding.wins}-{userTeamStanding.losses}{userTeamStanding.ties > 0 ? `-${userTeamStanding.ties}` : ''}</span>
                    <span>Sets {userTeamStanding.setsWon}-{userTeamStanding.setsLost}</span>
                    <span>Games {userTeamStanding.gamesWon}-{userTeamStanding.gamesLost}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="standings-controls card card--interactive">
            <div className="standings-controls-header">
              <div className="controls-copy">
                <span className="controls-title">Filter by league night</span>
                <span className="controls-subtitle">
                  {nightFilter === 'All'
                    ? 'Showing all teams'
                    : `Showing ${nightFilter} teams`}
                </span>
              </div>
              <button
                type="button"
                className="refresh-btn"
                onClick={fetchStandings}
                aria-label="Refresh standings"
              >
                Refresh Standings
              </button>
            </div>
            <div className="night-filter-group">
              {nightOptions.map((night) => (
                <button
                  key={night}
                  type="button"
                  className={`night-filter ${nightFilter === night ? 'active' : ''}`}
                  onClick={() => setNightFilter(night)}
                >
                  {night}
                </button>
              ))}
            </div>
            {formattedUpdatedAt && (
              <div className="updated-at">Last updated {formattedUpdatedAt}</div>
            )}
          </div>

          <div className="standings-table-card card card--interactive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>Night</th>
                  <th>Matches</th>
                  <th>Record</th>
                  <th>Win %</th>
                  <th>Sets (W-L)</th>
                  <th>Set %</th>
                  <th>Games (W-L)</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={9}>No results yet for this league night.</td>
                  </tr>
                ) : (
                  filteredStandings.map((team, index) => {
                    const rank = index + 1;
                    const record =
                      team.ties > 0
                        ? `${team.wins}-${team.losses}-${team.ties}`
                        : `${team.wins}-${team.losses}`;

                    return (
                      <tr
                        key={team.id}
                        className={index === 0 ? 'leader' : index < 3 ? 'top-three' : ''}
                      >
                        <td data-label="Rank">{rank}</td>
                        <td data-label="Team">
                          <div className="team-cell">
                            <span className="team-number">Team {team.number}</span>
                            <span className="team-name">{team.name}</span>
                          </div>
                        </td>
                        <td data-label="Night">{team.playNight || '—'}</td>
                        <td data-label="Matches">{team.matchesPlayed}</td>
                        <td data-label="Record">{record}</td>
                        <td data-label="Win %">
                          {team.matchesPlayed > 0
                            ? `${team.winPercentage.toFixed(1)}%`
                            : '0.0%'}
                        </td>
                        <td data-label="Sets (W-L)">
                          {team.setsWon} - {team.setsLost}
                        </td>
                        <td data-label="Set %">
                          {team.setsWon + team.setsLost > 0
                            ? `${team.setWinPercentage.toFixed(1)}%`
                            : '0.0%'}
                        </td>
                        <td data-label="Games (W-L)">
                          {team.gamesWon} - {team.gamesLost}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
};

export { Standings };
