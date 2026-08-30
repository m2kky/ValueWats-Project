const { randomUUID } = require('crypto');

const MAX_SOURCES = 20;
const MAX_ROWS = 5000;
const MAX_COLUMNS = 30;

function columnNumber(value) {
  return String(value).toUpperCase().split('').reduce((total, character) => (
    (total * 26) + character.charCodeAt(0) - 64
  ), 0);
}

function parseBoundedA1Range(value) {
  const range = String(value || '').trim();
  const match = range.match(/^(?:'[^']*(?:''[^']*)*'|[^!]+)!([A-Za-z]+)([1-9]\d*):([A-Za-z]+)([1-9]\d*)$/);
  if (!match) return null;
  const startColumn = columnNumber(match[1]);
  const startRow = Number(match[2]);
  const endColumn = columnNumber(match[3]);
  const endRow = Number(match[4]);
  if (
    endColumn < startColumn
    || endRow < startRow
    || endColumn - startColumn + 1 > MAX_COLUMNS
    || endRow - startRow + 1 > MAX_ROWS
  ) return null;
  return { range, startColumn, startRow, endColumn, endRow };
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function spreadsheetIdFrom(value) {
  const input = cleanText(value, 2048);
  const urlMatch = input.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,200})/);
  return (urlMatch?.[1] || input).slice(0, 200);
}

function normalizeSources(value, { createId = randomUUID } = {}) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_SOURCES) return null;
  const sources = [];
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const id = cleanText(item.id, 100) || createId();
    const name = cleanText(item.name, 120);
    const spreadsheetId = spreadsheetIdFrom(item.spreadsheetId);
    const range = cleanText(item.range, 200);
    const purpose = cleanText(item.purpose, 500);
    const useWhen = cleanText(item.useWhen, 500);
    const priority = Number(item.priority);
    if (
      ids.has(id)
      || !name
      || !/^[A-Za-z0-9_-]{20,200}$/.test(spreadsheetId)
      || !parseBoundedA1Range(range)
      || !purpose
      || !useWhen
      || !Number.isInteger(priority)
      || priority < 0
      || priority > 1000
    ) return null;
    ids.add(id);
    sources.push({ id, name, spreadsheetId, range, purpose, useWhen, priority });
  }
  return sources;
}

module.exports = {
  MAX_COLUMNS,
  MAX_ROWS,
  MAX_SOURCES,
  normalizeSources,
  parseBoundedA1Range
};
