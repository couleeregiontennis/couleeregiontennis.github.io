import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import usePlatform from '../scripts/PlatformDetector';
import useCopyToClipboard from '../scripts/CopyToClipboard';
import '../styles/Team.css';

export function Team() {
  const [teamData, setTeamData] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const { day, teamId } = useParams();
  const { copyToClipboard, copied } = useCopyToClipboard();
  const platform = usePlatform();

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const scheduleResponse = await fetch(`/teams/${day}/schedules/${teamId}.json`);
        const scheduleData = await scheduleResponse.json();
        const rosterResponse = await fetch(`/teams/${day}/rosters/${teamId}.json`);
        const rosterData = await rosterResponse.json();
        
        setTeamData(scheduleData);
        setRosterData(rosterData);
      } catch (err) {
        console.error('Error loading team data:', err);
      }
    };

    if (day && teamId) {
      loadTeamData();
    }
  }, [day, teamId]);

  if (!teamData || !rosterData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="team-page">
      <h1 className="team-name">{rosterData.teamName}</h1>
      
      <section className="schedule-section">
        <h2>Match Schedule</h2>
        <div className="calendar-download">
          <a 
            href={teamData.teamIcsPath || `/teams/${day}/ics/${teamId}/team.ics`}
            download="team.ics" 
            className="calendar-link"
          >
            📅 Download Full Season
          </a>
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
              {teamData.schedule.map(match => {
                const icsUrl = teamData.teamIcsPath || `/teams/${day}/ics/${teamId}/week${match.week}.ics`;
                // TODO: Make this have more detail once user logged in
                const message = `Hi! ${rosterData.teamName} needs a sub for ${day.charAt(0).toUpperCase() + day.slice(1)} ${match.date} at ${match.time} on ${match.courts}. Add to calendar: ${window.location.origin}${icsUrl}`;
                let groupMeUrl = '';
                if(platform === 'ios' || platform === 'android') {
                  // Use GroupMe URL scheme for mobile platforms
                  groupMeUrl = `groupme://share?text=${encodeURIComponent(message)}`;
                } else {
                  // Use a web URL for desktop
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
                            href={teamData.teamIcsPath || `/teams/${day}/ics/${teamId}/week${match.week}.ics`}
                            download={`match-date-${match.date}.ics`}
                            className="calendar-icon"
                            title="Add this match to calendar"
                          >
                            📅
                          </a>
                          <a
                            href={groupMeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="find-sub-icon"
                            title="Find Sub"
                            onClick={() => copyToClipboard(message)}
                            style={{
                              marginLeft: '0.5em',
                              fontSize: '1.2em',
                              color: '#00aff0',
                              textDecoration: 'none'
                            }}
                          >
                            🆘
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={match.opponent.file} className="team-link">
                        {match.opponent.name}
                      </a>
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
                <th>Position</th>
                <th>Name</th>
                <th>Captain</th>
              </tr>
            </thead>
            <tbody>
              {rosterData.roster.map(player => (
                <tr key={player.position}>
                  <td>{player.position}</td>
                  <td>{player.name}</td>
                  <td>{player.captain || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatDateUS(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}