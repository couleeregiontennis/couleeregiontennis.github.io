// This script dynamically loads match and roster data into tables and highlights the next match

async function loadTeamData(jsonUrl) {
  const tableBody = document.querySelector("#matches-table tbody");
  const rosterBody = document.querySelector("table:not(#matches-table) tbody");
  const header = document.querySelector("header h1");
  if (!tableBody || !rosterBody) return;

  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();

    // Update header with team name if available
    if (header && data.name) header.textContent = data.name;

    // Populate matches table
    tableBody.innerHTML = "";
    (data.matches || []).forEach(match => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${match.week}</td>
        <td>${match.date}</td>
        <td>${match.time}</td>
        <td>
          <a href="${match.opponent.file}" class="team-link">${match.opponent.name}</a>
        </td>
        <td>${match.courts}</td>
      `;
      tableBody.appendChild(tr);
    });

    // Populate roster table
    rosterBody.innerHTML = "";
    (data.roster || []).forEach(player => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${player.position}</td>
        <td>${player.name}</td>
        <td>${player.captain || ""}</td>
      `;
      rosterBody.appendChild(tr);
    });

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

// Get daye from URL, e.g. ?day=tuesday
function getDayFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("day");
}

// Usage: call this with the correct JSON file for the team
document.addEventListener("DOMContentLoaded", () => {
  const team = getTeamFromUrl();
  const day = getDayFromUrl();
  if (team && day) {
    // Adjust path as needed for your structure
    loadTeamData(`../data/${day}/${team}.json`);
  }
});
