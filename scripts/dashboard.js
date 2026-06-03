async function loadWeather(nextMatchDate) {
  const weatherWidget = document.getElementById('weather-widget');
  if (!weatherWidget) return;

  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=43.7892&longitude=-91.2511&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago');
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    
    let temp, apparentTemp, code, humidity, labelText;
    
    // Attempt to find the hourly forecast for 6:00 PM (18:00) on the next match date
    // Note: matches are scheduled for 5:30 PM & 7:00 PM; 6:00 PM represents the ideal overlap forecast hour.
    const targetTimeStr = `${nextMatchDate}T18:00`;
    const targetIndex = data.hourly?.time ? data.hourly.time.indexOf(targetTimeStr) : -1;
    
    if (targetIndex !== -1) {
      // Use forecasted weather for match time
      const hourlyTemp = data.hourly?.temperature_2m?.[targetIndex];
      const hourlyApparent = data.hourly?.apparent_temperature?.[targetIndex];
      const hourlyCode = data.hourly?.weather_code?.[targetIndex];
      const hourlyHumidity = data.hourly?.relative_humidity_2m?.[targetIndex];

      temp = hourlyTemp !== undefined ? Math.round(hourlyTemp) : '--';
      apparentTemp = hourlyApparent !== undefined ? Math.round(hourlyApparent) : '--';
      code = hourlyCode !== undefined ? hourlyCode : 0;
      humidity = hourlyHumidity !== undefined ? hourlyHumidity : '--';
      
      const dateObj = new Date(nextMatchDate + 'T12:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      labelText = `Forecast: ${formattedDate} @ 5:30 / 7pm`;
    } else {
      // Fallback to current weather
      const current = data.current || {};
      temp = current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : '--';
      apparentTemp = current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : '--';
      code = current.weather_code !== undefined ? current.weather_code : 0;
      humidity = current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : '--';
      labelText = 'Current Weather';
    }
    
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

    // Let's determine if the Heat Rule is active or if rain is forecasted
    let heatRuleText = 'Normal Play Conditions';
    let heatRuleClass = 'heat-alert-normal';
    const isRainy = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);

    if (typeof apparentTemp === 'number') {
      if (apparentTemp >= 104) {
        heatRuleText = '⚠️ OVER 104°F: Automatic Cancel!';
        heatRuleClass = 'heat-alert-cancel';
      } else if (apparentTemp >= 95) {
        heatRuleText = '⚠️ OVER 95°F: Optional 2-2 Start';
        heatRuleClass = 'heat-alert-warning';
      } else if (isRainy) {
        heatRuleText = '🌧️ Rain Forecasted: Watch for Updates';
        heatRuleClass = 'weather-alert-rain';
      }
    } else if (isRainy) {
      heatRuleText = '🌧️ Rain Forecasted: Watch for Updates';
      heatRuleClass = 'weather-alert-rain';
    }

    const tempDisplay = temp !== '--' ? `${temp}°F` : '--';
    const apparentDisplay = apparentTemp !== '--' ? `${apparentTemp}°F` : '--';
    const humidityDisplay = humidity !== '--' ? `${humidity}%` : '--';

    let ruleLink = '';
    if (heatRuleClass !== 'heat-alert-normal') {
      ruleLink = 'pages/ltta-rules.html#weather-cancellations';
    }

    const weatherRuleHtml = ruleLink 
      ? `<a href="${ruleLink}" class="weather-rule-status ${heatRuleClass}" style="display: block; font-weight: bold; font-size: 0.9rem; margin-bottom: 8px; padding: 6px; border-radius: 4px; text-align: center; text-decoration: none; color: inherit; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
          ${heatRuleText} <span style="font-size: 0.75rem; font-weight: normal; opacity: 0.9; text-decoration: underline; margin-left: 4px;">(View Rule)</span>
         </a>`
      : `<div class="weather-rule-status ${heatRuleClass}" style="font-weight: bold; font-size: 0.9rem; margin-bottom: 8px; padding: 6px; border-radius: 4px; text-align: center;">
          ${heatRuleText}
         </div>`;

    weatherWidget.innerHTML = `
      <h3>🌡️ Match Weather</h3>
      <div style="font-size: 0.8rem; margin-top: -8px; margin-bottom: 8px; opacity: 0.85; font-weight: bold;">
        ${labelText}
      </div>
      <div class="weather-info">
        <div class="weather-main">
          <span class="weather-temp-emoji" style="font-size: 2.2rem; margin-right: 8px;">${weatherEmoji}</span>
          <div style="text-align: left;">
            <div class="weather-temp-val" style="font-size: 1.6rem; font-weight: bold; line-height: 1.1;">${tempDisplay}</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">${weatherDesc}</div>
          </div>
        </div>
        
        <div class="weather-details" style="margin: 12px 0; font-size: 0.9rem; text-align: left; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Feels Like:</span>
            <strong style="color: var(--primary-color);">${apparentDisplay}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Humidity:</span>
            <span>${humidityDisplay}</span>
          </div>
        </div>

        ${weatherRuleHtml}

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
      <h3>🌡️ Match Weather</h3>
      <p style="font-size: 0.9rem; opacity: 0.8;">La Crosse, WI</p>
      <div style="margin: 12px 0; font-size: 0.8rem; line-height: 1.4; text-align: left;">
        Failed to load current weather. Please check directly on 
        <a href="https://www.accuweather.com/en/us/la-crosse/54601/weather-forecast/331528" target="_blank" rel="noopener noreferrer" style="font-weight: bold; color: var(--primary-color);">accuweather.com</a>.
      </div>
      <div style="font-size: 0.72rem; opacity: 0.75; text-align: left; border-top: 1px dotted rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px; line-height: 1.3;">
        💡 <strong>Tip:</strong> If you use an ad-blocker or Brave shields, they may block our weather forecast provider. Try pausing them for this site to restore the widget.
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
    let nextMatchDate = todayStr;
    
    // Find the first match that is today or in the future
    const nextMatch = allMatches.find(m => m.date >= todayStr);
    
    if (nextMatch) {
      activeWeek = nextMatch.week;
      weekMatches = allMatches.filter(m => m.week === activeWeek);
      nextMatchDate = nextMatch.date;
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
          <div class="days-wrapper">
    `;

    dates.forEach(date => {
      const isToday = date === todayStr;
      const dateObj = new Date(date + 'T12:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const dayMatches = grouped[date] || [];

      // Group matches by time slot dynamically
      const slots = {};
      dayMatches.forEach(m => {
        const time = m.time || 'TBD';
        if (!slots[time]) slots[time] = [];
        slots[time].push(m);
      });

      // Sort time slots chronologically
      const times = Object.keys(slots).sort((a, b) => {
        if (a === 'TBD') return 1;
        if (b === 'TBD') return -1;
        return a.localeCompare(b);
      });

      const renderSlot = (matches) => {
        if (matches.length === 0) return '<div class="no-matches" style="font-size: 0.8rem; opacity: 0.6; padding: 4px;">No matches</div>';
        return matches.map(m => `
          <div class="match-row">
            <span class="match-teams">${m.teamA?.name ?? ''} <span class="vs">vs</span> ${m.teamB?.name ?? ''}</span>
            <span class="match-courts-badge">${m.courts?.replace('Courts ', 'C') ?? ''}</span>
          </div>
        `).join('');
      };

      const renderedSlots = times.map((time, idx) => `
        <div class="time-slot" style="${idx > 0 ? 'margin-top: 8px;' : ''}">
          <div class="slot-title">${time}</div>
          <div class="slot-content">
            ${renderSlot(slots[time])}
          </div>
        </div>
      `).join('');

      html += `
        <div class="day-card ${isToday ? 'today' : ''}">
          <h4 class="day-header">${isToday ? '🔥 TONIGHT' : dayName}</h4>
          <div class="day-slots-container">
            ${renderedSlots || '<div class="no-matches">No matches scheduled</div>'}
          </div>
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
    
    // Fetch and load weather for next match date
    loadWeather(nextMatchDate);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);



