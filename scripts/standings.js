const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ09FIuDMkX5mmdp9e-szR15pWx2cp-YyqsYxoNBL4FM0y8v3Q_LKboCjAEcUyobbgwCCGQpSMT3bXh/pub?output=csv";
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

fetch(CSV_URL)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split('\n').map(r => r.split(','));
    const thead = document.querySelector('#standings-table thead');
    const tbody = document.querySelector('#standings-table tbody');

    // Insert filter buttons above the table
    const filterContainer = document.createElement('div');
    filterContainer.style.textAlign = "center";
    filterContainer.style.marginBottom = "1em";
    filterContainer.innerHTML = `
      <button class="night-filter" data-night="All">All</button>
      <button class="night-filter" data-night="Tuesday">Tuesday</button>
      <button class="night-filter" data-night="Wednesday">Wednesday</button>
    `;
    const tableResponsive = document.querySelector('.table-responsive');
    if (tableResponsive && tableResponsive.parentNode) {
      tableResponsive.parentNode.insertBefore(filterContainer, tableResponsive);
    }

    // Header
    thead.innerHTML = '<tr>' + rows[0].map(h => `<th>${escapeHTML(h)}</th>`).join('') + '</tr>';

    // Clear body for 2026
    tbody.innerHTML = '<tr><td colspan="' + rows[0].length + '" style="text-align:center; padding: 2rem;">2026 Standings will be updated once the season begins!</td></tr>';
    return; // Stop here for now

    // Add event listeners to filter buttons
    filterContainer.querySelectorAll('.night-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        renderTable(btn.dataset.night);
        // Optional: highlight active button
        filterContainer.querySelectorAll('.night-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });