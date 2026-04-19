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
  assert.ok(html.includes('Tues Team 1: Topspin Wizards'), 'Should include team header');
  assert.ok(html.includes('John Doe'), 'Should include captain name');
  assert.ok(html.includes('555-0101'), 'Should include captain phone');
  assert.ok(html.includes('Tuesday, June 3'), 'Should include correct league start date');
  assert.ok(html.includes('Tom Dwyer'), 'Should include Tuesday coordinator');
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

  assert.ok(html.includes('Wed Team 2: Baseline Bashers'), 'Should include team header');
  assert.ok(html.includes('Wednesday, June 4'), 'Should include correct league start date');
  assert.ok(html.includes('Mark Hoff'), 'Should include Wednesday coordinator');
});
