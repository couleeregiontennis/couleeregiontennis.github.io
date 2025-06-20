// This script dynamically loads match and roster data into tables and highlights the next match
async function loadTeamData(scheduleUrl, rosterUrl) {
  const tableBody = document.querySelector("#matches-table tbody");
  const rosterBody = document.querySelector("table:not(#matches-table) tbody");
  const header = document.getElementById("team-name");
  if (!tableBody || !rosterBody) return;

  try {
    const scheduleResponse = await fetch(scheduleUrl);
    const scheduleData = await scheduleResponse.json();
    const rosterResponse = await fetch(rosterUrl);
    const rosterData = await rosterResponse.json();

    // Update header with team name if available
    if (header && rosterData.teamName) header.textContent = rosterData.teamName;

    // Populate matches table
    tableBody.innerHTML = "";
    (scheduleData.schedule || []).forEach(match => {
      const icsLink = match.ics
        ? `<a href="${match.ics}" download="LTTA-Match-Week${match.week}.ics" title="Add to calendar">📅</a>`
        : '';
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${match.week}</td>
        <td>${formatDateUS(match.date)}</td>
        <td>${match.time}</td>
        <td>
          <a href="${match.opponent.file}" class="team-link">${match.opponent.name}</a>
        </td>
        <td>${match.courts}</td>
        <td style="text-align:center">${icsLink}</td>
      `;
      tableBody.appendChild(tr);
    });

    // Populate roster table
    rosterBody.innerHTML = "";
    (rosterData.roster || []).forEach(player => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${player.position}</td>
        <td>${player.name}</td>
        <td>${player.captain || ""}</td>
      `;
      rosterBody.appendChild(tr);
    });

    // After loading the team data and knowing the ICS path:
    document.getElementById('add-all-ics').href = scheduleData.teamIcsPath || `/teams/${scheduleData.night}/ics/${scheduleData.team.replace(/\s+/g, '_')}/team.ics`;

    highlightNextMatch();
  } catch (err) {
    tableBody.innerHTML = "<tr><td colspan='5'>Could not load match data.</td></tr>";
    rosterBody.innerHTML = "<tr><td colspan='3'>Could not load roster data.</td></tr>";
  }
}

function highlightNextMatch() {
    const rows = document.querySelectorAll("#matches-table tbody tr");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    let nextMatchRow = null;
    let nextMatchDate = null;
    
    rows.forEach((row) => {
        const dateCell = row.cells[1];
        const matchDate = new Date(dateCell.textContent.trim());
        matchDate.setHours(0, 0, 0, 0); // Set to start of match day
        
        if (matchDate >= today && (!nextMatchDate || matchDate < nextMatchDate)) {
            nextMatchRow = row;
            nextMatchDate = matchDate;
        }
    });
    
    if (nextMatchRow) {
        nextMatchRow.classList.add("highlight");
    }
}

// Get team from URL, e.g. ?team=team1
function getTeamFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("team");
}

// Get daye from URL, e.g. ?day=tuesday
function getDayFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("day");
}

// Format date to US format MM/DD/YYYY
function formatDateUS(dateStr) {
  // Expects dateStr in 'YYYY-MM-DD'
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y}`;
}

// Usage: call this with the correct JSON file for the team
document.addEventListener("DOMContentLoaded", () => {
  const team = getTeamFromUrl();
  const day = getDayFromUrl();
  if (team && day) {
    // Adjust path as needed for your structure
    loadTeamData(`../teams/${day}/schedules/${team}.json`, `../teams/${day}/rosters/${team}.json`);
  }
});
