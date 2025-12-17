import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../scripts/supabaseClient';
import usePlatform from '../scripts/PlatformDetector';
import { MatchResults } from './MatchResults';
import { FindSubButton } from './FindSubButton';
import { generateFullSeasonICS, downloadICSFile } from '../scripts/icsGenerator';
import '../styles/Team.css';

export const Team = () => {
  const [schedule, setSchedule] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [teamUUID, setTeamUUID] = useState(null);
  const [roster, setRoster] = useState([]);
  const [opponentRosters, setOpponentRosters] = useState({});
  const [isGeneratingICS, setIsGeneratingICS] = useState(false);
  const { day, teamId } = useParams();
  const platform = usePlatform();

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        // 1. Fetch team details to get name and UUID
        const { data: teamDetails, error: teamError } = await supabase
          .from('team')
          .select('id, name')
          .eq('number', teamId)
          .eq('play_night', day)
          .single();

        if (teamError) throw teamError;
        if (!teamDetails) {
          console.error('Team not found');
          return;
        }
        setTeamName(teamDetails.name);
        setTeamUUID(teamDetails.id);

        // 2. Fetch schedule from matches table
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('matches')
          .select('*')
          .or(`home_team_number.eq.${teamId},away_team_number.eq.${teamId}`)
          .order('week', { ascending: true });

        if (scheduleError) throw scheduleError;
        setSchedule(scheduleData || []);

        // 3. Fetch player IDs from the junction table
        const { data: playerLinks, error: linksError } = await supabase
          .from('player_to_team')
          .select('player')
          .eq('team', teamDetails.id);

        if (linksError) throw linksError;
        const playerIds = playerLinks.map(link => link.player);

        // 4. Fetch player details for the roster
        if (playerIds.length > 0) {
          const { data: rosterData, error: rosterError } = await supabase
            .from('player')
            .select('id, first_name, last_name, is_captain')
            .in('id', playerIds);

          if (rosterError) throw rosterError;
          setRoster(rosterData || []);
        }

        // 5. Fetch opponent rosters for all matches
        await fetchOpponentRosters(scheduleData || []);
      } catch (err) {
        console.error('Error loading team data:', err);
      }
    };

    if (day && teamId) {
      loadTeamData();
    }
  }, [day, teamId]);

  const fetchOpponentRosters = async (matches) => {
    try {
      const opponentTeamNumbers = [...new Set(
        matches.map(match => {
          const isHome = match.home_team_number === parseInt(teamId);
          return isHome ? match.away_team_number : match.home_team_number;
        })
      )];

      const rostersData = {};

      for (const opponentNumber of opponentTeamNumbers) {
        // Get opponent team details
        const { data: opponentTeam, error: teamError } = await supabase
          .from('team')
          .select('id, name')
          .eq('number', opponentNumber)
          .eq('play_night', day)
          .single();

        if (teamError || !opponentTeam) continue;

        // Get opponent player IDs
        const { data: opponentPlayerLinks, error: linksError } = await supabase
          .from('player_to_team')
          .select('player')
          .eq('team', opponentTeam.id);

        if (linksError || !opponentPlayerLinks) continue;

        const opponentPlayerIds = opponentPlayerLinks.map(link => link.player);

        // Get opponent player details
        if (opponentPlayerIds.length > 0) {
          const { data: opponentRosterData, error: rosterError } = await supabase
            .from('player')
            .select('id, first_name, last_name, is_captain')
            .in('id', opponentPlayerIds);

          if (!rosterError && opponentRosterData) {
            rostersData[opponentNumber] = opponentRosterData;
          }
        }
      }

      setOpponentRosters(rostersData);
    } catch (err) {
      console.error('Error fetching opponent rosters:', err);
    }
  };

  const handleDownloadFullSeason = async () => {
    if (schedule.length === 0) {
      alert('No matches found to export.');
      return;
    }

    setIsGeneratingICS(true);
    try {
      // Add current team ID to matches for ICS generation
      const matchesWithTeamId = schedule.map(match => ({
        ...match,
        current_team_id: teamId
      }));

      const icsContent = generateFullSeasonICS(
        matchesWithTeamId,
        teamName,
        roster,
        opponentRosters
      );

      const filename = `${teamName.replace(/[^a-zA-Z0-9]/g, '_')}_Full_Season.ics`;
      downloadICSFile(icsContent, filename);
    } catch (error) {
      console.error('Error generating ICS file:', error);
      alert('Error generating calendar file. Please try again.');
    } finally {
      setIsGeneratingICS(false);
    }
  };

  if (!teamName) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="team-page">
      <h1 className="team-name">{teamName}</h1>

      <section className="schedule-section">
        <h2>Match Schedule</h2>
        <div className="calendar-download">
          <button
            onClick={handleDownloadFullSeason}
            disabled={isGeneratingICS || schedule.length === 0}
            className="calendar-link"
            title="Download complete season calendar with opponent rosters"
          >
            {isGeneratingICS ? '⏳ Generating...' : '📅 Download Full Season'}
          </button>
        </div>

        <div className="table-responsive">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Opponent</th>
                <th>Courts</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(match => {
                const isHome = match.home_team_number === parseInt(teamId);
                const opponentNumber = isHome ? match.away_team_number : match.home_team_number;
                const opponentName = isHome ? match.away_team_name : match.home_team_name;
                const opponentNight = day; // Assuming opponent plays on the same night for simplicity

                const icsUrl = `/teams/${day}/ics/${teamId}/week${match.week}.ics`;
                const message = `Hi! ${teamName} needs a sub for ${day.charAt(0).toUpperCase() + day.slice(1)} ${match.date} at ${match.time} on ${match.courts}. Add to calendar: ${window.location.origin}${icsUrl}`;
                let groupMeUrl = '';
                if (platform === 'ios' || platform === 'android') {
                  groupMeUrl = `groupme://share?text=${encodeURIComponent(message)}`;
                } else {
                  groupMeUrl = `https://web.groupme.com/share?text=${encodeURIComponent(message)}`;
                }

                return (
                  <tr key={match.week}>
                    <td>
                      <div className="date-time">
                        <div className="date">{formatDateUS(match.date)}</div>
                        <div className="time-container">
                          <span className="time">{match.time}</span>
                          <a
                            href={icsUrl}
                            download={`match-date-${match.date}.ics`}
                            className="calendar-icon"
                            title="Add this match to calendar"
                          >
                            📅
                          </a>
                          <FindSubButton message={message} url={groupMeUrl} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/team/${opponentNight}/${opponentNumber}`} className="team-link">
                        {opponentName}
                      </Link>
                    </td>
                    <td>{match.courts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="roster-section">
        <h2>Team Roster</h2>
        <div className="table-responsive">
          <table className="roster-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Captain</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(player => (
                <tr key={player.id}>
                  <td>{`${player.first_name} ${player.last_name}`}</td>
                  <td>{player.is_captain ? 'Yes' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="results-section">
        <MatchResults teamNumber={teamId} teamNight={day} teamId={teamUUID} />
      </section>
    </div>
  );
};

function formatDateUS(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}