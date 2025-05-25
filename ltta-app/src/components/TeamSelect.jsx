import { Link } from 'react-router-dom';
import '../styles/TeamSelect.css';

export function TeamSelect() {
  const tuesdayTeams = [
    { id: 1, name: 'Spin Doctors' },
    { id: 2, name: 'Tennis the Menace' },
    { id: 3, name: 'Zoomers' },
    { id: 4, name: 'Approach Shots' },
    { id: 5, name: 'Racquet Scientists' },
    { id: 6, name: 'Rascals' },
    { id: 7, name: "Good Ol' Boys" },
    { id: 8, name: 'Return to Sender With Love' },
    { id: 9, name: 'Bounce It' },
    { id: 10, name: 'Jetsetters' },
    { id: 11, name: 'Full Metal Racquet' },
    { id: 12, name: 'Easy Overhead' }
  ];

  const wednesdayTeams = [
    { id: 1, name: 'LAX-Winona Infusion' },
    { id: 2, name: 'Rally Monkeys' },
    { id: 3, name: 'Hit Squad' },
    { id: 4, name: 'Hot Shots' },
    { id: 5, name: 'Glory Days' },
    { id: 6, name: "Howie's Team" },
    { id: 7, name: 'Serve Aces' },
    { id: 8, name: 'Not My Fault' },
    { id: 9, name: 'Baseliners' },
    { id: 10, name: 'Backhand Bandits' },
    { id: 11, name: 'Simply Smashing' },
    { id: 12, name: 'Nothing But Net' }
  ];

  return (
    <div>
      <h1>Teams</h1>
      <section className="teams-container">
        <div className="teams-column">
          <h2>LTTA Tuesday Tennis – 2025</h2>
          <div>
            <Link to="/team/tuesday/all">All Team's Matches</Link>
          </div>
          <p>Choose your team to view your match schedule.</p>
          <ul className="team-list">
            {tuesdayTeams.map(team => (
              <li key={`tuesday-${team.id}`}>
                <Link to={`/team/tuesday/${team.id}`}>
                  Team {team.id} – {team.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="teams-column">
          <h2>LTTA Wednesday Tennis – 2025</h2>
          <div>
            <Link to="/team/wednesday/all">All Team's Matches</Link>
          </div>
          <p>Choose your team to view your match schedule.</p>
          <ul className="team-list">
            {wednesdayTeams.map(team => (
              <li key={`wednesday-${team.id}`}>
                <Link to={`/team/wednesday/${team.id}`}>
                  Team {team.id} – {team.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}