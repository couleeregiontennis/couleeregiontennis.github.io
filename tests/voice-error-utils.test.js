import { test } from 'node:test';
import assert from 'node:assert';
import { getActionableErrorMessage } from '../src/hooks/voiceErrorUtils.js';

test('classifies Load failed as a network/CORS error', () => {
  const message = getActionableErrorMessage(new Error('Load failed'), null);
  assert.ok(message.includes('Network error'));
  assert.ok(message.includes('score parsing service'));
});

test('classifies 401 as an authentication error', () => {
  const message = getActionableErrorMessage(new Error('User not authenticated.'), 401);
  assert.ok(message.includes('session has expired'));
});

test('classifies 500 as a server error', () => {
  const message = getActionableErrorMessage(new Error('AI parsing failed with status: 500'), 500);
  assert.ok(message.includes('Server error'));
});

test('classifies 400 as an invalid request error', () => {
  const message = getActionableErrorMessage(new Error('Transcript too long'), 400);
  assert.ok(message.includes('Invalid request'));
});

test('falls back to generic AI parsing error for unknown errors', () => {
  const message = getActionableErrorMessage(new Error('Something unexpected'), 200);
  assert.ok(message.startsWith('Error parsing score with AI'));
});
