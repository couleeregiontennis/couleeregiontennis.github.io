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
import { ProtectedRoute } from './components/ProtectedRoute';
import { AddScore } from './components/AddScore';
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
            <Route path="/login" element={<Login />} />
            <Route
              path="/add-score"
              element={
                <ProtectedRoute>
                  <AddScore />
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