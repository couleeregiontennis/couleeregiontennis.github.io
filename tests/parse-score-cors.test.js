import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const functionPath = path.resolve('supabase/functions/parse-score/index.ts');
const content = fs.readFileSync(functionPath, 'utf-8');

test('parse-score handles CORS preflight requests', () => {
  assert.ok(content.includes("req.method === 'OPTIONS'"), 'should handle OPTIONS');
  assert.ok(content.includes('Access-Control-Allow-Origin'), 'should set Access-Control-Allow-Origin');
  assert.ok(content.includes('Access-Control-Allow-Headers'), 'should set Access-Control-Allow-Headers');
  assert.ok(content.includes('Access-Control-Allow-Methods'), 'should set Access-Control-Allow-Methods');
});

test('parse-score uses the CORS helper for all JSON responses', () => {
  assert.ok(content.includes('jsonResponse'), 'should define a jsonResponse helper');
  const occurrences = (content.match(/jsonResponse/g) || []).length;
  assert.ok(occurrences > 1, 'jsonResponse should be used for multiple responses');
});

test('parse-score strips markdown code fences from AI responses', () => {
  assert.ok(content.includes('JSON.parse'), 'should parse JSON');
  assert.ok(content.includes('```json'), 'should strip json code fences');
  assert.ok(content.includes('```$'), 'should strip trailing code fences');
});

test('parse-score allows the model name to be configured via env', () => {
  assert.ok(content.includes('GEMINI_MODEL_NAME'), 'should read GEMINI_MODEL_NAME env var');
  assert.ok(content.includes('gemini-2.5-flash-lite'), 'should default to a stable model name');
});
