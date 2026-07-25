(function() {
  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRXXJgqymosDbuyhAHCpHHUqQsNxRk0B-3kBGWr7CuPymhKUpT83JKyN7DxkCiaPdKsZEeBaA3GDjH/pub?gid=1910758219&single=true&output=csv';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function parseCSV(text) {
    var lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    var headers = lines[0].split(',').map(function(h) { return h.trim(); });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var vals = lines[i].split(',');
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = (vals[j] || '').trim();
      }
      rows.push(obj);
    }
    return { headers: headers, rows: rows };
  }

  function getWeeks(h) {
    return h.filter(function(x) { return /^Week\s+\d+$/i.test(x); });
  }

  function fmt(v) {
    if (!v || v === '') return { t: '\u2014', c: 'cell-empty' };
    if (v.toUpperCase() === 'WEATHER') return { t: 'WEATHER', c: 'cell-weather', ti: 'Postponed due to weather' };
    if (v === '?') return { t: '?', c: 'cell-unknown', ti: 'Not yet reported' };
    if (!isNaN(Number(v))) return { t: v, c: '' };
    return { t: v, c: '' };
  }

  function render(rows, weeks, night) {
    var root = document.getElementById('standings-root');
    if (!root) return;
    root.innerHTML = '';

    var groups = {};
    rows.forEach(function(r) {
      var n = (r.Night || '').trim();
      if (!n) return;
      var k = n.toLowerCase();
      if (!groups[k]) groups[k] = { night: n, teams: [] };
      groups[k].teams.push(r);
    });

    // Sort teams by Total Points desc
    Object.values(groups).forEach(function(g) {
      g.teams.sort(function(a, b) {
        var pa = parseInt(a['Total Points'], 10) || 0;
        var pb = parseInt(b['Total Points'], 10) || 0;
        if (pb !== pa) return pb - pa;
        return (a['Team Name'] || '').localeCompare(b['Team Name'] || '');
      });
    });

    var allNights = ['tuesday', 'wednesday'].filter(function(k) { return groups[k]; }).map(function(k) { return groups[k].night; });

    var keys = ['tuesday', 'wednesday'].filter(function(k) { return groups[k]; });
    if (night && night !== 'All') {
      keys = keys.filter(function(k) { return k === night.toLowerCase(); });
    }

    // Filter buttons
    var ctrl = document.createElement('div');
    ctrl.className = 'controls-bar';
    var btns = ['All'].concat(allNights);
    var html = '<div>';
    btns.forEach(function(n) {
      html += '<button class="night-filter' + ((night || 'All') === n ? ' active' : '') + '">' + esc(n) + '</button>';
    });
    html += '</div><button class="refresh-btn" onclick="location.reload()">Refresh</button>';
    ctrl.innerHTML = html;
    root.appendChild(ctrl);

    // Legend
    var lg = document.createElement('div');
    lg.className = 'legend';
    lg.innerHTML = '<span class="legend-item"><span class="legend-badge badge-weather">WEATHER</span> Postponed</span>' +
      '<span class="legend-item"><span class="legend-badge badge-unknown">?</span> Not yet reported</span>' +
      '<span class="legend-item"><span class="legend-badge badge-empty">\u2014</span> No data</span>';
    root.appendChild(lg);

    // Tables
    keys.forEach(function(k) {
      var g = groups[k];
      var sec = document.createElement('div');
      sec.className = 'night-section';
      sec.innerHTML = '<h2>' + esc(g.night) + ' League</h2>';

      var t = '<div class="table-responsive"><table><thead><tr><th class="col-rank">#</th><th class="col-team">Team</th>';
      weeks.forEach(function(w) { t += '<th>' + esc(w) + '</th>'; });
      t += '<th class="col-total">Total</th></tr></thead><tbody>';

      g.teams.forEach(function(tm, i) {
        var rc = i === 0 ? ' row-leader' : '';
        t += '<tr class="' + rc + '"><td>' + (i + 1) + '</td><td class="col-team">' + esc(tm['Team Name']) + '</td>';
        weeks.forEach(function(w) {
          var c = fmt(tm[w]);
          t += '<td class="' + c.c + '"' + (c.ti ? ' title="' + esc(c.ti) + '"' : '') + '>' + esc(c.t) + '</td>';
        });
        t += '<td class="col-total">' + esc(tm['Total Points'] || '\u2014') + '</td></tr>';
      });

      t += '</tbody></table></div>';
      sec.innerHTML += t;
      root.appendChild(sec);
    });

    // Filter click
    root.querySelectorAll('.night-filter').forEach(function(b) {
      b.addEventListener('click', function() { render(rows, weeks, b.textContent); });
    });
  }

  // Fetch
  fetch(CSV_URL)
    .then(function(r) {
      if (!r.ok) throw new Error('Failed to fetch (HTTP ' + r.status + ')');
      return r.text();
    })
    .then(function(t) {
      if (!t || !t.trim()) throw new Error('Empty response');
      if (t.trim().charAt(0) === '<') throw new Error('Received HTML instead of CSV');
      var p = parseCSV(t);
      if (!p.rows.length) {
        document.getElementById('standings-root').innerHTML = '<div class="empty-msg">No standings data available yet.</div>';
        return;
      }
      render(p.rows, getWeeks(p.headers), 'All');
    })
    .catch(function(e) {
      document.getElementById('standings-root').innerHTML =
        '<div class="error-msg">' + esc(e.message) + '<br><br><button class="refresh-btn" onclick="location.reload()">Try Again</button></div>';
    });
})();