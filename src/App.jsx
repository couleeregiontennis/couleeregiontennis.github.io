import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Team } from './components/Team';
import { Rules } from './components/Rules';
import { Login } from './components/Login';
import { ProtectedRoute } from './scripts/ProtectedRoute';
import { AddScore } from './components/AddScore';
import { Standings } from './components/Standings';
import { CaptainDashboard } from './components/CaptainDashboard';
import { PlayerProfile } from './components/PlayerProfile';
import { MatchSchedule } from './components/MatchSchedule';
import { NotFound } from './components/NotFound';
import { LandingPage } from './components/LandingPage';
import { ScheduleGenerator } from './components/admin/ScheduleGenerator';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { PlayerRankings } from './components/PlayerRankings';
import { MySchedule } from './components/MySchedule';
import { CourtsLocations } from './components/CourtsLocations';
import { PlayerResources } from './components/PlayerResources';
import { AuthProvider } from './context/AuthProvider';
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
    <AuthProvider>
      <Router>
        <div className={`App theme-${theme}`}>
          <Navigation theme={theme} onToggleTheme={toggleTheme} />
          <AnnouncementBar />
          <main>
            <Routes>
              <Route path="/" element={<MatchSchedule />} />
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/team/:day/:teamId" element={<Team />} />
              <Route path="/player-resources" element={<PlayerResources />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/player-rankings" element={<PlayerRankings />} />
              <Route path="/courts-locations" element={<CourtsLocations />} />
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
                path="/admin/schedule-generator"
                element={
                  <ProtectedRoute>
                    <ScheduleGenerator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute>
                    <AuditLogViewer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/player-management"
                element={
                  <ProtectedRoute>
                    <div>Player Management (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/team-management"
                element={
                  <ProtectedRoute>
                    <div>Team Management (Coming Soon)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/player-profile"
                element={
                  <ProtectedRoute>
                    <PlayerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-schedule"
                element={
                  <ProtectedRoute>
                    <MySchedule />
                  </ProtectedRoute>
                }
              />
              <Route path="/schedule" element={<MatchSchedule />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;