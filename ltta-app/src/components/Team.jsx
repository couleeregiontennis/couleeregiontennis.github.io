import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export function Team() {
  const [teamData, setTeamData] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const { day, teamId } = useParams();

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

  return (
    <div className="table-responsive">
      <main>
        <div>
          <h1>{rosterData?.teamName || ''}</h1>
        </div>
        <div>
          <h2>Match Schedule</h2>
          <p>
            <a 
              href={teamData?.teamIcsPath || `/teams/${day}/ics/${teamId}/team.ics`}
              download="team.ics" 
              title="Add all matches to your calendar"
            >
              📅 Download Full Season
            </a>
          </p>
        </div>
        <table id="matches-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Date</th>
              <th>Time</th>
              <th>Opponent</th>
              <th>Courts</th>
            </tr>
          </thead>
          <tbody>
            {teamData?.schedule?.map(match => (
              <tr key={match.week}>
                <td>{match.week}</td>
                <td>{formatDateUS(match.date)}</td>
                <td>{match.time}</td>
                <td>
                  <a href={match.opponent.file} className="team-link">
                    {match.opponent.name}
                  </a>
                </td>
                <td>{match.courts}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Team Roster</h2>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Name</th>
              <th>Captain</th>
            </tr>
          </thead>
          <tbody>
            {rosterData?.roster?.map(player => (
              <tr key={player.name}>
                <td>{player.position}</td>
                <td>{player.name}</td>
                <td>{player.captain || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

function formatDateUS(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}