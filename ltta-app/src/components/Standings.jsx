<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>LTTA Standings</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="../styles/style.css" />
    <link rel="stylesheet" href="../styles/nav.css" />
    <style>
      .night-filter.active {
        background: #007bff;
        color: #fff;
        border-radius: 4px;
      }
      .night-filter {
        margin: 0 0.3em;
        padding: 0.4em 1em;
        border: 1px solid #007bff;
        background: #eaf2fa;
        color: #007bff;
        cursor: pointer;
        font-weight: 600;
      }
      .night-filter:hover {
        background: #d2e6fa;
      }
    </style>
  </head>
  <body>
    <div id="nav-placeholder"></div>
    <main>
      <h1>Standings</h1>
      <table id="standings-table">
        <thead></thead>
        <tbody></tbody>
      </table>
    </main>
    <script src="../scripts/nav.js"></script>
    <script src="../scripts/standings.js"></script>
  </body>
</html>
