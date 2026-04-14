const express = require('express');
const router = express.Router();
const tenantContext = require('../middleware/tenantContext');
const checkPermission = require('../middleware/checkPermission');
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
router.post('/', checkPermission('contacts.manage'), createContact);
router.get('/activity', getActivityLogs);
router.post('/import', checkPermission('contacts.manage'), upload.single('file'), importContacts);

// Labels
router.get('/labels', listLabels);
router.post('/labels', checkPermission('contacts.manage'), createLabel);
router.put('/labels/:id', checkPermission('contacts.manage'), updateLabel);
router.delete('/labels/:id', checkPermission('contacts.manage'), deleteLabel);

// Single contact
router.get('/:id', getContact);
router.put('/:id', checkPermission('contacts.manage'), updateContact);
router.delete('/:id', checkPermission('contacts.manage'), deleteContact);

// Notes
router.post('/:id/notes', checkPermission('contacts.manage'), addNote);
router.delete('/:id/notes/:noteId', checkPermission('contacts.manage'), deleteNote);

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
