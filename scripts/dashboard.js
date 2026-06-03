async function loadWeather() {
  const weatherWidget = document.getElementById('weather-widget');
  if (!weatherWidget) return;

  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=43.7892&longitude=-91.2511&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago');
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    
    const current = data.current;
    const temp = Math.round(current.temperature_2m);
    const apparentTemp = Math.round(current.apparent_temperature);
    const code = current.weather_code;
    const humidity = current.relative_humidity_2m;
    
    // Map WMO codes to description & emoji
    let weatherDesc = 'Clear';
    let weatherEmoji = '☀️';
    
    if (code === 0) { weatherDesc = 'Sunny'; weatherEmoji = '☀️'; }
    else if (code >= 1 && code <= 3) { weatherDesc = 'Partly Cloudy'; weatherEmoji = '🌤️'; }
    else if (code === 45 || code === 48) { weatherDesc = 'Foggy'; weatherEmoji = '🌫️'; }
    else if (code >= 51 && code <= 55) { weatherDesc = 'Drizzle'; weatherEmoji = '🌧️'; }
    else if (code >= 56 && code <= 57) { weatherDesc = 'Freezing Drizzle'; weatherEmoji = '🌧️'; }
    else if (code >= 61 && code <= 65) { weatherDesc = 'Rain'; weatherEmoji = '🌧️'; }
    else if (code >= 66 && code <= 67) { weatherDesc = 'Freezing Rain'; weatherEmoji = '🌧️'; }
    else if (code >= 71 && code <= 75) { weatherDesc = 'Snow'; weatherEmoji = '❄️'; }
    else if (code === 77) { weatherDesc = 'Snow Grains'; weatherEmoji = '❄️'; }
    else if (code >= 80 && code <= 82) { weatherDesc = 'Rain Showers'; weatherEmoji = '🌦️'; }
    else if (code >= 85 && code <= 86) { weatherDesc = 'Snow Showers'; weatherEmoji = '❄️'; }
    else if (code >= 95 && code <= 99) { weatherDesc = 'Thunderstorm'; weatherEmoji = '⛈️'; }

    // Let's determine if the Heat Rule is active
    let heatRuleText = '';
    let heatRuleClass = '';
    if (apparentTemp >= 104) {
      heatRuleText = '⚠️ OVER 104°F: Automatic Cancel!';
      heatRuleClass = 'heat-alert-cancel';
    } else if (apparentTemp >= 95) {
      heatRuleText = '⚠️ OVER 95°F: Optional 2-2 Start';
      heatRuleClass = 'heat-alert-warning';
    } else {
      heatRuleText = 'Normal Play Conditions';
      heatRuleClass = 'heat-alert-normal';
    }

    weatherWidget.innerHTML = `
      <h3>🌡️ La Crosse Weather</h3>
      <div class="weather-info">
        <div class="weather-main">
          <span class="weather-temp-emoji" style="font-size: 2.2rem; margin-right: 8px;">${weatherEmoji}</span>
          <div style="text-align: left;">
            <div class="weather-temp-val" style="font-size: 1.6rem; font-weight: bold; line-height: 1.1;">${temp}°F</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">${weatherDesc}</div>
          </div>
        </div>
        
        <div class="weather-details" style="margin: 12px 0; font-size: 0.9rem; text-align: left; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Feels Like:</span>
            <strong style="color: var(--primary-color);">${apparentTemp}°F</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Humidity:</span>
            <span>${humidity}%</span>
          </div>
        </div>

        <div class="weather-rule-status ${heatRuleClass}" style="font-weight: bold; font-size: 0.9rem; margin-bottom: 8px; padding: 6px; border-radius: 4px; text-align: center;">
          ${heatRuleText}
        </div>

        <div style="font-size: 0.72rem; opacity: 0.85; line-height: 1.3; text-align: center;">
          LTTA uses the "RealFeel" temperature on 
          <a href="https://www.accuweather.com/en/us/la-crosse/54601/weather-forecast/331528" target="_blank" rel="noopener noreferrer" style="font-weight: bold; color: inherit; text-decoration: underline;">accuweather.com</a> 
          for playability decisions.
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error fetching weather:', err);
    weatherWidget.innerHTML = `
      <h3>🌡️ Weather</h3>
      <p style="font-size: 0.9rem; opacity: 0.8;">La Crosse, WI</p>
      <div style="margin: 12px 0; font-size: 0.8rem; line-height: 1.4; text-align: left;">
        Failed to load current weather. Please check directly on 
        <a href="https://www.accuweather.com/en/us/la-crosse/54601/weather-forecast/331528" target="_blank" rel="noopener noreferrer" style="font-weight: bold; color: var(--primary-color);">accuweather.com</a>.
      </div>
    `;
  }
}

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
      <div class="dashboard-container">
        <div class="dashboard matches-card">
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
        <div class="dashboard weather-card" id="weather-widget">
          <h3>🌡️ Weather</h3>
          <div class="weather-loading">Loading weather...</div>
        </div>
      </div>
    `;

    placeholder.innerHTML = html;
    
    // Fetch and load weather
    loadWeather();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);

