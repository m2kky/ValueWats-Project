const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Extract Sheet ID from Google Sheet URL
 * @param {string} url 
 * @returns {string|null}
 */
const extractSheetId = (url) => {
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

/**
 * Fetch and parse Google Sheet data (Public/Anyone with link)
 * @param {string} url 
 * @returns {Promise<Array>} Array of row objects
 */
const fetchSheetData = async (url) => {
  const sheetId = extractSheetId(url);
  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL');
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  try {
    const response = await axios.get(csvUrl, { responseType: 'stream' });
    const results = [];

    return new Promise((resolve, reject) => {
      response.data
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  } catch (error) {
    console.error('Error fetching Google Sheet:', error.message);
    throw new Error('Failed to fetch Google Sheet. Ensure it is public (Anyone with the link).');
  }
};

/**
 * Fetch just the headers (columns) from the sheet
 * @param {string} url 
 * @returns {Promise<Array>} Array of column names
 */
const fetchSheetHeaders = async (url) => {
  const data = await fetchSheetData(url);
  if (data.length === 0) return [];
  return Object.keys(data[0]);
};

module.exports = {
  fetchSheetData,
  fetchSheetHeaders
};
