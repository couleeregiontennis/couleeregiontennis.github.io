const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ09FIuDMkX5mmdp9e-szR15pWx2cp-YyqsYxoNBL4FM0y8v3Q_LKboCjAEcUyobbgwCCGQpSMT3bXh/pub?output=csv";
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
    thead.innerHTML = '<tr>' + rows[0].map(h => `<th>${h}</th>`).join('') + '</tr>';

    // Find the "ranks" and "Night" column indices (case-insensitive)
    const totalIdx = rows[0].findIndex(h => h.trim().toLowerCase() === "rank");
    const nightIdx = rows[0].findIndex(h => h.trim().toLowerCase() === "night");

    // Render function with filter
    function renderTable(night) {
      let filteredRows = rows.slice(1);
      if (night && night !== "All" && nightIdx !== -1) {
        filteredRows = filteredRows.filter(row => row[nightIdx].toLowerCase() === night.toLowerCase());
      }
      const sortedRows = filteredRows.sort((a, b) => {
        const aVal = parseFloat(a[totalIdx]) || 0;
        const bVal = parseFloat(b[totalIdx]) || 0;
        return bVal - aVal;
      });
      tbody.innerHTML = sortedRows.map(row =>
        '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
      ).join('');
    }

    // Initial render (all)
    renderTable("All");

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