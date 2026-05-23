const test = require('node:test');
const assert = require('node:assert');
const { generateEmailTemplate } = require('../management-scripts/create-emails.js');

test('generateEmailTemplate should return a string containing team details', (t) => {
  const mockTeam = {
    night: 'Tues',
    teamNumber: '1',
    teamName: 'Topspin Wizards',
    captain: {
      name: 'John Doe',
      phone: '555-0101'
    },
    coCaptain: {
      name: 'Jane Smith',
      phone: '555-0102'
    }
  };

  const html = generateEmailTemplate(mockTeam);

  assert.ok(typeof html === 'string', 'Template should be a string');
  assert.ok(html.includes('Topspin Wizards'), 'Should include team name');
  assert.ok(html.includes('Tues #1'), 'Should include team number and night');
  assert.ok(html.includes('John Doe'), 'Should include captain name');
  assert.ok(html.includes('Tuesday'), 'Should include match day');
  assert.ok(html.includes('Tom Dwyer'), 'Should include Tuesday coordinator');
  assert.ok(html.includes('Jane Smith'), 'Should include co-captain name');
  assert.ok(html.includes('href="https://couleeregiontennis.org"'), 'Should include website domain');
});

test('generateEmailTemplate should handle Wednesday teams', (t) => {
  const mockTeam = {
    night: 'Wed',
    teamNumber: '2',
    teamName: 'Baseline Bashers',
    captain: {
      name: 'Alice Brown',
      phone: '555-0201'
    }
  };

  const html = generateEmailTemplate(mockTeam);

  assert.ok(html.includes('Baseline Bashers'), 'Should include team name');
  assert.ok(html.includes('Wed #2'), 'Should include team number and night');
  assert.ok(html.includes('Wednesday'), 'Should include match day');
  assert.ok(html.includes('Mark Hoff'), 'Should include Wednesday coordinator');
});
