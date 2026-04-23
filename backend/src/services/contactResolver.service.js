const fs = require('fs');
const xlsx = require('xlsx');
const prisma = require('../config/database');
const googleSheetService = require('./googleSheetService');
const crmService = require('./crmService');

class ContactResolverService {
  
  /**
   * Main entry point to resolve contacts based on input parameters.
   * Returns an array of valid contacts with standard format: { number: String, variables: Object }
   */
  async resolveContacts({ type, targetConfig, googleSheetUrl, phoneColumn, segmentId, numbers }, file, tenantId) {
    let contacts = [];

    if (type === 'retargeting') {
      contacts = await this.resolveFromRetargeting(targetConfig, tenantId);
    } else if (file) {
      contacts = await this.resolveFromFile(file.path);
    } else if (googleSheetUrl) {
      contacts = await this.resolveFromGoogleSheet(googleSheetUrl, phoneColumn);
    } else if (segmentId) {
      contacts = await this.resolveFromSegment(segmentId, tenantId);
    } else if (numbers) {
      contacts = await this.resolveFromManual(numbers);
    } else {
      throw new Error('No contacts provided (CSV, Sheet, Segment, or Manual)');
    }

    if (contacts.length === 0) {
      throw new Error('No valid contacts found or matched.');
    }

    // Sanitize phone numbers: strip non-digits, validate length
    contacts = contacts.map(c => ({
      ...c,
      number: c.number.replace(/[^0-9]/g, '')
    })).filter(c => c.number.length >= 7 && c.number.length <= 15);

    if (contacts.length === 0) {
      throw new Error('No valid phone numbers found. Numbers must be 7-15 digits.');
    }

    return contacts;
  }

  async resolveFromRetargeting(targetConfig, tenantId) {
    try {
      const config = typeof targetConfig === 'string' ? JSON.parse(targetConfig) : targetConfig;
      
      let crmReq = { limit: 9999999 };
      if (config.segmentId) {
        const segment = await prisma.savedSegment.findUnique({ where: { id: config.segmentId, tenantId } });
        if (segment) {
          crmReq.search = segment.rules.search;
          crmReq.lifecycleStageId = segment.rules.filters?.lifecycleStageId;
          crmReq.labelIds = segment.rules.filters?.labelIds?.length > 0 ? segment.rules.filters.labelIds : undefined;
          crmReq.governorate = segment.rules.filters?.governorate;
          crmReq.source = segment.rules.filters?.source;
        }
      }
      
      // Override segment rules with specific selections from advanced filters
      if (config.lifecycleStageId) crmReq.lifecycleStageId = config.lifecycleStageId;
      if (config.labelIds && config.labelIds.length > 0) crmReq.labelIds = config.labelIds;
      if (config.source) crmReq.source = config.source;

      const result = await crmService.listContacts(tenantId, crmReq);
      if (!result.contacts || result.contacts.length === 0) {
        throw new Error('No CRM contacts match your retargeting filters.');
      }

      return result.contacts.map(c => ({
        number: c.phoneNumber.trim(),
        variables: { name: c.name, email: c.email }
      }));
    } catch (e) {
      console.error('Retargeting config parse error', e);
      throw new Error(e.message === 'No CRM contacts match your retargeting filters.' ? e.message : 'Invalid retargeting configuration.');
    }
  }

  async resolveFromFile(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonData.length === 0) {
        throw new Error('File is empty.');
      }

      const headers = Object.keys(jsonData[0]).map(h => h.trim().toLowerCase());
      const originalHeaders = Object.keys(jsonData[0]);

      const numberIndex = headers.indexOf('number');
      const phoneIndex = headers.indexOf('phone');
      const mobileIndex = headers.indexOf('mobile');

      let targetKey = null;
      if (numberIndex !== -1) targetKey = originalHeaders[numberIndex];
      else if (phoneIndex !== -1) targetKey = originalHeaders[phoneIndex];
      else if (mobileIndex !== -1) targetKey = originalHeaders[mobileIndex];

      if (!targetKey) {
        throw new Error("File must contain a 'number', 'phone', or 'mobile' column header.");
      }

      return jsonData.map(row => {
        const number = String(row[targetKey]).trim();
        if (number && number.length >= 7) {
          return { number, variables: row };
        }
        return null;
      }).filter(Boolean);

    } catch (err) {
      console.error('File Parse Error:', err);
      throw new Error(err.message.includes('File must contain') || err.message === 'File is empty.' ? err.message : 'Failed to parse file. Ensure it is a valid CSV or Excel file.');
    } finally {
      try { fs.unlinkSync(filePath); } catch (e) { } // Clean up
    }
  }

  async resolveFromGoogleSheet(googleSheetUrl, phoneColumn) {
    const sheetData = await googleSheetService.fetchSheetData(googleSheetUrl);

    if (sheetData.length === 0) {
      throw new Error("Google Sheet is empty or could not be read.");
    }

    if (!phoneColumn) {
      throw new Error("Please specify which column contains the Phone Number for Google Sheet.");
    }

    return sheetData.map(row => {
      const number = row[phoneColumn];
      if (!number) return null;

      return {
        number: number.trim(),
        variables: row 
      };
    }).filter(Boolean);
  }

  async resolveFromSegment(segmentId, tenantId) {
    const segment = await prisma.savedSegment.findUnique({
      where: { id: segmentId, tenantId }
    });
    
    if (!segment) {
      throw new Error('Saved segment not found.');
    }

    const rules = segment.rules.filters || {};
    const search = segment.rules.search;
    
    const crmReq = {
      search,
      lifecycleStageId: rules.lifecycleStageId,
      labelIds: rules.labelIds?.length > 0 ? rules.labelIds : undefined,
      governorate: rules.governorate,
      source: rules.source,
      limit: 9999999 
    };

    const result = await crmService.listContacts(tenantId, crmReq);
    
    if (!result.contacts || result.contacts.length === 0) {
      throw new Error('Selected segment contains no contacts.');
    }

    return result.contacts.map(c => ({
      number: c.phoneNumber.trim(),
      variables: { name: c.name, email: c.email }
    })).filter(c => c.number);
  }

  async resolveFromManual(numbers) {
    const lines = numbers.split('\n');
    return lines.map(line => ({ number: line.trim() })).filter(c => c.number && c.number.length >= 7);
  }
}

module.exports = new ContactResolverService();
