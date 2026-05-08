async function loadDashboard() {
  const placeholder = document.getElementById('dashboard-placeholder');
  if (!placeholder) return;

  try {
    const [tueRes, wedRes] = await Promise.all([
      fetch('teams/tuesday/schedules/master_schedule.json?v=2026'),
      fetch('teams/wednesday/schedules/master_schedule.json?v=2026')
    ]);

    const tueSched = await tueRes.json();
    const wedSched = await wedRes.json();
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Find the next upcoming week
    // Combine and sort all unique dates
    const allMatches = [...tueSched, ...wedSched].sort((a, b) => a.date.localeCompare(b.date));
    
    let activeWeek = null;
    let weekMatches = [];
    
    // Find the first match that is today or in the future
    const nextMatch = allMatches.find(m => m.date >= todayStr);
    
    if (nextMatch) {
      activeWeek = nextMatch.week;
      weekMatches = allMatches.filter(m => m.week === activeWeek);
    } else {
      // Off-season or season ended
      return;
    }

    // Group week matches by date
    const grouped = {};
    weekMatches.forEach(m => {
      if (!grouped[m.date]) grouped[m.date] = [];
      grouped[m.date].push(m);
    });

    const dates = Object.keys(grouped).sort();
    
    let html = `
      <div class="dashboard">
        <h3>🎾 Week ${activeWeek} Matches</h3>
        <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
    `;

    dates.forEach(date => {
      const isToday = date === todayStr;
      const dateObj = new Date(date + 'T12:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      
      html += `
        <div class="day-card" style="${isToday ? 'color: var(--primary-color);' : ''}">
          <p style="margin-bottom: 4px;">${isToday ? '🔥 TONIGHT' : dayName}</p>
          <span style="font-size: 0.9rem; opacity: 0.8;">5:30pm & 7:00pm</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    placeholder.innerHTML = html;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
