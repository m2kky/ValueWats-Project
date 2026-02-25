const crmService = require('../services/crmService');
const csvService = require('../services/csvService');
const fs = require('fs');

const listContacts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, lifecycleStageId, labelIds, governorate, source, page, limit } = req.query;
    const result = await crmService.listContacts(tenantId, {
      search,
      lifecycleStageId,
      labelIds: labelIds ? (Array.isArray(labelIds) ? labelIds : [labelIds]) : undefined,
      governorate,
      source,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
    res.json(result);
  } catch (error) {
    console.error('[ContactController] listContacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

const getContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const contact = await crmService.getContact(tenantId, req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    console.error('[ContactController] getContact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

const createContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const contact = await crmService.createContact(tenantId, req.body);
    res.status(201).json(contact);
  } catch (error) {
    console.error('[ContactController] createContact:', error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'Phone number already exists' });
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

const updateContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const contact = await crmService.updateContact(tenantId, req.params.id, req.body);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    console.error('[ContactController] updateContact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

const deleteContact = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const ok = await crmService.deleteContact(tenantId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('[ContactController] deleteContact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

const importContacts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const rows = await csvService.parseFile(req.file.path);
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    const result = await crmService.bulkImport(tenantId, rows);
    res.json(result);
  } catch (error) {
    console.error('[ContactController] importContacts:', error);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
};

// Notes
const addNote = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const note = await crmService.addNote(tenantId, req.params.id, req.user.id, req.body.content);
    if (!note) return res.status(404).json({ error: 'Contact not found' });
    res.status(201).json(note);
  } catch (error) {
    console.error('[ContactController] addNote:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
};

const deleteNote = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const ok = await crmService.deleteNote(tenantId, req.params.noteId);
    if (!ok) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('[ContactController] deleteNote:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

// Labels
const listLabels = async (req, res) => {
  try {
    const labels = await crmService.listLabels(req.user.tenantId);
    res.json(labels);
  } catch (error) {
    console.error('[ContactController] listLabels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
};

const createLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const label = await crmService.createLabel(req.user.tenantId, name, color);
    res.status(201).json(label);
  } catch (error) {
    console.error('[ContactController] createLabel:', error);
    if (error.code === 'P2002') return res.status(409).json({ error: 'Label name already exists' });
    res.status(500).json({ error: 'Failed to create label' });
  }
};

const updateLabel = async (req, res) => {
  try {
    const label = await crmService.updateLabel(req.user.tenantId, req.params.id, req.body);
    if (!label) return res.status(404).json({ error: 'Label not found' });
    res.json(label);
  } catch (error) {
    console.error('[ContactController] updateLabel:', error);
    res.status(500).json({ error: 'Failed to update label' });
  }
};

const deleteLabel = async (req, res) => {
  try {
    const ok = await crmService.deleteLabel(req.user.tenantId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Label not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('[ContactController] deleteLabel:', error);
    res.status(500).json({ error: 'Failed to delete label' });
  }
};

// Activity logs
const getActivityLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { contactId, conversationId, limit } = req.query;
    const logs = await crmService.getActivityLogs(tenantId, { contactId, conversationId, limit: limit ? parseInt(limit) : 30 });
    res.json(logs);
  } catch (error) {
    console.error('[ContactController] getActivityLogs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

module.exports = {
  listContacts, getContact, createContact, updateContact, deleteContact,
  importContacts, addNote, deleteNote,
  listLabels, createLabel, updateLabel, deleteLabel,
  getActivityLogs,
};
