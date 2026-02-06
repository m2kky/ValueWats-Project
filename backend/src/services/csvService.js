const fs = require('fs');
const csv = require('csv-parser');

/**
 * Parses a CSV file and returns an array of contacts
 * @param {string} filePath - Path to the uploaded CSV file
 * @returns {Promise<Array>} - Array of objects { number, name, ... }
 */
const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Normalize keys to lowercase
        const normalized = {};
        Object.keys(data).forEach(key => {
          normalized[key.toLowerCase().trim()] = data[key];
        });
        
        // Extract phone number (support 'phone', 'number', 'mobile', 'whatsapp')
        const number = normalized.phone || normalized.number || normalized.mobile || normalized.whatsapp;
        
        if (number) {
          results.push({
            number: number.replace(/\D/g, ''), // Clean non-digits
            name: normalized.name || ''
          });
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

module.exports = { parseCsv };
