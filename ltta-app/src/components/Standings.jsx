import { useState, useEffect, useMemo } from 'react';
import '../styles/Style.css';
import '../styles/Standings.css';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ09FIuDMkX5mmdp9e-szR15pWx2cp-YyqsYxoNBL4FM0y8v3Q_LKboCjAEcUyobbgwCCGQpSMT3bXh/pub?output=csv";

const Standings = () => {
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

  const filteredRows = useMemo(() => {
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
    <main className="standings-page">
      <h1>Standings</h1>
      <div className="standings-card">
        <div className="standings-filters">
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
        <div className="standings-table-wrapper">
          <table id="standings-table">
            <thead>
              <tr>
                {header.map((h, index) => (
                  <th key={index}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export { Standings };
