const express = require('express');
const router = express.Router();
const tenantContext = require('../middleware/tenantContext');
const upload = require('../middleware/upload');
const {
  listContacts, getContact, createContact, updateContact, deleteContact,
  importContacts, addNote, deleteNote,
  listLabels, createLabel, updateLabel, deleteLabel,
  getActivityLogs,
} = require('../controllers/contactController');

router.use(tenantContext);

// Contacts CRUD
router.get('/', listContacts);
router.post('/', createContact);
router.get('/activity', getActivityLogs);
router.post('/import', upload.single('file'), importContacts);

// Labels
router.get('/labels', listLabels);
router.post('/labels', createLabel);
router.put('/labels/:id', updateLabel);
router.delete('/labels/:id', deleteLabel);

// Single contact
router.get('/:id', getContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

// Notes
router.post('/:id/notes', addNote);
router.delete('/:id/notes/:noteId', deleteNote);

module.exports = router;
