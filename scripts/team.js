// This script dynamically loads match and roster data into tables and highlights the next match
function isMobile() {
  return window.innerWidth <= 600;
}

async function loadTeamData(scheduleUrl, rosterUrl) {
  const tableBody = document.querySelector("#matches-table tbody");
  const rosterBody = document.querySelector("table:not(#matches-table) tbody");
  const header = document.getElementById("team-name");
  const headerRow = document.getElementById("matches-header-row");
  if (!tableBody || !rosterBody) return;

  // Remove any existing calendar column
  while (headerRow.cells.length > 5) headerRow.deleteCell(-1);

  // Add calendar column only if not mobile
  if (!isMobile()) {
    const th = document.createElement("th");
    th.className = "calendar-col";
    th.title = "Add to Calendar";
    headerRow.appendChild(th);
  }

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
        ? `<a href="${match.ics}" download="LTTA-Match-Week${match.week}.ics" title="Add to calendar" class="calendar-col-link">📅</a>`
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
        ${!isMobile() ? `<td class="calendar-col" style="text-align:center">${icsLink}</td>` : ''}
      `;
      tableBody.appendChild(tr);

      // Mobile: Add a separate row for the calendar link
      if (isMobile() && match.ics) {
        const mobileRow = document.createElement("tr");
        mobileRow.className = "calendar-row-mobile";
        mobileRow.innerHTML = `<td colspan="6" style="text-align:center">
          <a href="${match.ics}" download="LTTA-Match-Week${match.week}.ics" title=" Add to calendar" class="calendar-mobile-link">📅 Add to Calendar</a>
        </td>`;
        tableBody.appendChild(mobileRow);
      }
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

// Highlight the upcoming match row
function highlightNextMatch() {
  const rows = document.querySelectorAll("#matches-table tbody tr");
  const today = new Date();
  let nextMatchRow = null;

  rows.forEach((row) => {
    // Only check main match rows (not mobile calendar rows)
    if (row.classList.contains("calendar-row-mobile")) return;
    const dateCell = row.cells[1];
    const matchDate = new Date(dateCell.textContent.trim());
    if (
      matchDate >= today &&
      (!nextMatchRow ||
        matchDate < new Date(nextMatchRow.cells[1].textContent.trim()))
    ) {
      nextMatchRow = row;
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

// Get day from URL, e.g. ?day=tuesday
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
