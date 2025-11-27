import { Link } from 'react-router-dom';
import '../styles/Style.css';

export const NotFound = () => {
  return (
    <main className="not-found-page card card--interactive">
      <h1>Page not found</h1>
      <p>
        We couldn't find the page you were looking for. Use the main navigation or return to the
        team directory to continue exploring the league resources.
      </p>
      <div className="not-found-actions">
        <Link to="/" className="refresh-btn">
          ← Back to Teams
        </Link>
      </div>
    </main>
  );
};
