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

// Contact Custom Field Values
const prisma = require('../config/database');

router.get('/:id/fields', async (req, res) => {
  try {
    const fields = await prisma.contactField.findMany({
      where: {
        tenantId: req.tenantId,
        contactNumber: req.params.id // we use contactId as the contactNumber here
      }
    });
    res.json(fields);
  } catch (error) {
    // Fallback: try looking up the contact's phoneNumber
    try {
      const contact = await prisma.contact.findUnique({ where: { id: req.params.id } });
      if (!contact) return res.json([]);
      const fields = await prisma.contactField.findMany({
        where: { tenantId: req.tenantId, contactNumber: contact.phoneNumber }
      });
      res.json(fields);
    } catch (e) {
      res.json([]);
    }
  }
});

// Per-contact label assignment (for bulk actions)
router.post('/:id/labels', async (req, res) => {
  const { labelId } = req.body;
  if (!labelId) return res.status(400).json({ error: 'labelId required' });
  try {
    await prisma.contactLabelAssignment.upsert({
      where: {
        contactId_labelId: {
          contactId: req.params.id,
          labelId: labelId
        }
      },
      update: {},
      create: {
        contactId: req.params.id,
        labelId: labelId
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning label:', error);
    res.status(500).json({ error: 'Failed to assign label' });
  }
});

module.exports = router;
