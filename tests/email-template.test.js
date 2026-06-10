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
  assert.ok(html.includes('Your Team: Topspin Wizards (Tues #1)'), 'Should include team header');
  assert.ok(html.includes('John Doe'), 'Should include captain name');
  assert.ok(html.includes('Tuesday'), 'Should include match day');
  assert.ok(html.includes('Tom Dwyer'), 'Should include Tuesday coordinator');
  assert.ok(html.includes('Jane Smith'), 'Should include co-captain name');
  assert.ok(html.includes('The water fountain at Green Island is currently out of order'), 'Should include water warning');
  assert.ok(html.includes('RealFeel'), 'Should include heat rule');
  assert.ok(html.includes('crossover championship'), 'Should include championship details');
  assert.ok(html.includes('href="https://couleeregiontennis.org"'), 'Should include website domain');
  assert.ok(html.includes('Weather Cancellations / Rainouts'), 'Should include weather cancellations heading');
  assert.ok(html.includes('prorated format based on the percentage of possible points'), 'Should include partial cancellation/prorating details');
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

  assert.ok(html.includes('Your Team: Baseline Bashers (Wed #2)'), 'Should include team header');
  assert.ok(html.includes('Wednesday'), 'Should include correct match day');
  assert.ok(html.includes('Mark Hoff'), 'Should include Wednesday coordinator');
});
