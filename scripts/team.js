// This script highlights the next match in the table by adding a class to the corresponding row
// It assumes that the date is in the second cell of each row and is formatted as "YYYY-MM-DD"
document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll("tbody tr");
  const today = new Date();

  let nextMatchRow = null;

  rows.forEach(row => {
    const dateCell = row.cells[1]; // The second cell contains the date
    const matchDate = new Date(dateCell.textContent.trim());

    if (matchDate >= today && (!nextMatchRow || matchDate < new Date(nextMatchRow.cells[1].textContent.trim()))) {
      nextMatchRow = row;
    }
  });

  if (nextMatchRow) {
    nextMatchRow.classList.add("highlight");
  }
});