import { useState, useEffect } from 'react';
import { supabase } from '../scripts/supabaseClient';
import { TeamSelect } from './TeamSelect';
import { MatchSchedule } from './MatchSchedule';
import '../styles/LandingPage.css';

export const LandingPage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userTeamId, setUserTeamId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUserAndTeam();
  }, []);

  const checkUserAndTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // If user is authenticated, try to get their team assignment
      if (currentUser) {
        const { data: teamLink, error: teamLinkError } = await supabase
          .from('player_to_team')
          .select('team ( id )')
          .eq('player', currentUser.id)
          .maybeSingle();

        if (teamLinkError) {
          console.error('Team link fetch error:', teamLinkError);
          // User might not have a team assigned yet
          setUserTeamId(null);
        } else {
          setUserTeamId(teamLink?.team?.id ?? null);
        }
      }

    } catch (err) {
      console.error('Error in checkUserAndTeam:', err);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-page">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={checkUserAndTeam} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated and has a team assigned, show their team's schedule
  if (user && userTeamId) {
    return <MatchSchedule />;
  }

  // If user is not authenticated OR doesn't have a team assigned, show team selection
  return <TeamSelect />;
};