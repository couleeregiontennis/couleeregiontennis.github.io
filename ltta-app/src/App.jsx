import React, { useEffect, useMemo, useState } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Team } from './components/Team';
import { TeamSelect } from './components/TeamSelect';
import { Subs } from './components/Subs';
import { GreenIsland } from './components/GreenIsland';
import { Rules } from './components/Rules';
import { Login } from './components/Login';
import { ProtectedRoute } from './scripts/ProtectedRoute';
import { AddScore } from './components/AddScore';
import { Standings } from './components/Standings';
import { CaptainDashboard } from './components/CaptainDashboard';
import { LeagueStats } from './components/LeagueStats';
import { PlayerProfile } from './components/PlayerProfile';
import { MatchSchedule } from './components/MatchSchedule';
import { TeamStats } from './components/TeamStats';
import { AllMatches } from './components/AllMatches';
import { NotFound } from './components/NotFound';
import './styles/colors.css';
import './styles/Style.css';
import './styles/Navigation.css';

const THEME_STORAGE_KEY = 'ltta-theme-preference';

function App() {
  const prefersDarkScheme = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return prefersDarkScheme ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Router>
      <div className={`App theme-${theme}`}>
        <Navigation theme={theme} onToggleTheme={toggleTheme} />
        <AnnouncementBar />
        <main>
          <Routes>
            <Route path="/" element={<TeamSelect />} />
            <Route path="/team/:day/all" element={<AllMatches />} />
            <Route path="/team/:day/:teamId" element={<Team />} />
            <Route path="/subs" element={<Subs />} />
            <Route path="/greenisland" element={<GreenIsland />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/add-score"
              element={
                <ProtectedRoute>
                  <AddScore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/captain-dashboard"
              element={
                <ProtectedRoute>
                  <CaptainDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team-performance"
              element={
                <ProtectedRoute>
                  <TeamStats />
                </ProtectedRoute>
              }
            />
            <Route path="/league-stats" element={<LeagueStats />} />
            <Route
              path="/player-profile"
              element={
                <ProtectedRoute>
                  <PlayerProfile />
                </ProtectedRoute>
              }
            />
            <Route path="/schedule" element={<MatchSchedule />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;