import React from 'react'; 
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
import { User } from './components/User';
import Standings from './components/Standings';
import './styles/Style.css';
import './styles/Navigation.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <AnnouncementBar />
        <main>
          <Routes>
            <Route path="/" element={<TeamSelect />} />
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
              path="/user"
              element={
                <ProtectedRoute>
                  <User />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;