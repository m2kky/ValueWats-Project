const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const path = require('path');

const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const normalized = {};
        Object.keys(data).forEach(key => {
          normalized[key.toLowerCase().trim()] = data[key];
        });
        const number = normalized.phone || normalized.number || normalized.mobile || normalized.whatsapp;
        if (number) {
          results.push({
            number: number.replace(/\D/g, ''),
            name: normalized.name || '',
            email: normalized.email || '',
            ...normalized,
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map(row => {
    const normalized = {};
    Object.keys(row).forEach(k => { normalized[k.toLowerCase().trim()] = row[k]; });
    return normalized;
  }).filter(r => r.phone || r.number || r.mobile || r.whatsapp);
};

// Unified entry point used by contactController
const parseFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return parseCsv(filePath);
  return parseExcel(filePath);
};

module.exports = { parseCsv, parseFile };
