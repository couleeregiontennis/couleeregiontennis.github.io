import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import '../styles/TeamSelect.css';

export const TeamSelect = () => {
  const [tuesdayTeams, setTuesdayTeams] = useState([]);
  const [wednesdayTeams, setWednesdayTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from('team').select('*');
      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTuesdayTeams(
          data
            .filter(team => team.play_night === 'tuesday')
            .sort((a, b) => a.number - b.number)
        );
        setWednesdayTeams(
          data
            .filter(team => team.play_night === 'wednesday')
            .sort((a, b) => a.number - b.number)
        );
      }
    };

    fetchTeams();
  }, []);

  return (
    <div>
      <h1>Teams</h1>
      <section className="teams-container">
        <div className="teams-column">
          <h2>Tuesday</h2>
          <div>
            <Link to="/team/tuesday/all">All Team's Matches</Link>
          </div>
          <p>Choose your team to view your match schedule.</p>
          <ul className="team-list">
            {tuesdayTeams.map(team => (
              <li key={team.id}>
                <Link to={`/team/tuesday/${team.number}`}>
                  Team {team.number} – {team.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="teams-column">
          <h2>Wednesday</h2>
          <div>
            <Link to="/team/wednesday/all">All Team's Matches</Link>
          </div>
          <p>Choose your team to view your match schedule.</p>
          <ul className="team-list">
            {wednesdayTeams.map(team => (
              <li key={team.id}>
                <Link to={`/team/wednesday/${team.number}`}>
                  Team {team.number} – {team.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};