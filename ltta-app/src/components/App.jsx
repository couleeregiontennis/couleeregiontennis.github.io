import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Teams } from './components/Teams';
import { Navigation } from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <AnnouncementBar />
        <main>
          <Routes>
            <Route path="/" element={<Teams />} />
            <Route path="/team/:day/:teamId" element={<TeamSchedule />} />
            {/* Add other routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;