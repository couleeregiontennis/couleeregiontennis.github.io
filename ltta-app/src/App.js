import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Team } from './components/Team';
import { TeamSelect } from './components/TeamSelect';
import { Subs } from './components/Subs';
import { GreenIsland } from './components/GreenIsland';
import { Rules } from './components/Rules';
import './styles/style.css';
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
            <Route path="/teams" element={<Navigate to="/" replace />} />
            <Route path="/team/:day/:teamId" element={<Team />} />
            <Route path="/subs" element={<Subs />} />
            <Route path="/greenisland" element={<GreenIsland />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
