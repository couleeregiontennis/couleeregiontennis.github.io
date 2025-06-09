import React, { useState, useEffect } from 'react';
import '../styles/Style.css';
import '../styles/nav.css';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ09FIuDMkX5mmdp9e-szR15pWx2cp-YyqsYxoNBL4FM0y8v3Q_LKboCjAEcUyobbgwCCGQpSMT3bXh/pub?output=csv";

function Standings() {
  const [data, setData] = useState([]);
  const [nightFilter, setNightFilter] = useState("All");
  const [header, setHeader] = useState([]);

  useEffect(() => {
    fetch(CSV_URL)
      .then(res => res.text())
      .then(csv => {
        const rows = csv.trim().split('\n').map(r => r.split(','));
        setData(rows.slice(1));
        setHeader(rows[0]);
      });
  }, []);

  // Find the "Total" and "Night" column indices (case-insensitive)
  const totalIdx = header.findIndex(h => h?.trim().toLowerCase() === "total");
  const nightIdx = header.findIndex(h => h?.trim().toLowerCase() === "night");

  const filteredRows = React.useMemo(() => {
    let filtered = data;
    if (nightFilter !== "All" && nightIdx !== -1) {
      filtered = data.filter(row => row[nightIdx]?.toLowerCase() === nightFilter.toLowerCase());
    }
    return filtered.sort((a, b) => {
      const aVal = parseFloat(a[totalIdx]) || 0;
      const bVal = parseFloat(b[totalIdx]) || 0;
      return bVal - aVal;
    });
  }, [data, nightFilter, nightIdx, totalIdx]);

  const handleFilterClick = (night) => {
    setNightFilter(night);
  };

  return (
    <main>
      <h1>Standings</h1>
      <div style={{ textAlign: "center", marginBottom: "1em" }}>
        <button
          className={`night-filter ${nightFilter === "All" ? "active" : ""}`}
          data-night="All"
          onClick={() => handleFilterClick("All")}
        >
          All
        </button>
        <button
          className={`night-filter ${nightFilter === "Tuesday" ? "active" : ""}`}
          data-night="Tuesday"
          onClick={() => handleFilterClick("Tuesday")}
        >
          Tuesday
        </button>
        <button
          className={`night-filter ${nightFilter === "Wednesday" ? "active" : ""}`}
          data-night="Wednesday"
          onClick={() => handleFilterClick("Wednesday")}
        >
          Wednesday
        </button>
      </div>
      <table id="standings-table">
        <thead>
          <tr>
            {header.map((h, index) => (
              <th key={index}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default Standings;
