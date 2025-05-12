// This script updates the date of all matches in the JSON files in the specified directory.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data', 'wednesday');
const output = path.join(dir, 'combined-wednesday.json');

const files = fs.readdirSync(dir).filter(f => /^\d+\.json$/.test(f));
const combined = [];

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  combined.push(data);
});

fs.writeFileSync(output, JSON.stringify(combined, null, 2));
console.log('Combined file written to', output);