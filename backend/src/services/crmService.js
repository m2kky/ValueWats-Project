const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CrmService {
  async listContacts(tenantId, { search, lifecycleStageId, labelIds, governorate, source, page = 1, limit = 50 }) {
    const where = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (lifecycleStageId) where.lifecycleStageId = lifecycleStageId;
    if (governorate) where.governorate = governorate;
    if (source) where.source = source;
    if (labelIds && labelIds.length > 0) {
      where.labels = { some: { labelId: { in: labelIds } } };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          lifecycleStage: { select: { id: true, name: true, color: true, emoji: true } },
          labels: { include: { label: { select: { id: true, name: true, color: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return { contacts, total, page, limit };
  }

  async getContact(tenantId, id) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        lifecycleStage: true,
        labels: { include: { label: true } },
        notes: { orderBy: { createdAt: 'desc' } },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!contact) return null;

    // Attach conversation if exists
    const conversation = await prisma.conversation.findFirst({
      where: { tenantId, contactNumber: contact.phoneNumber },
      select: { id: true, status: true, lastMessageAt: true, unreadCount: true },
    });
    return { ...contact, conversation };
  }

  async createContact(tenantId, data) {
    const { labelIds, ...fields } = data;
    const contact = await prisma.contact.create({
      data: {
        tenantId,
        ...fields,
        labels: labelIds && labelIds.length > 0
          ? { create: labelIds.map(labelId => ({ labelId })) }
          : undefined,
      },
      include: {
        lifecycleStage: { select: { id: true, name: true, color: true, emoji: true } },
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      },
    });
    return contact;
  }

  async updateContact(tenantId, id, data) {
    const { labelIds, ...fields } = data;

    const exists = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!exists) return null;

    if (labelIds !== undefined) {
      await prisma.contactLabelAssignment.deleteMany({ where: { contactId: id } });
      if (labelIds.length > 0) {
        await prisma.contactLabelAssignment.createMany({
          data: labelIds.map(labelId => ({ contactId: id, labelId })),
        });
      }
    }

    return prisma.contact.update({
      where: { id },
      data: fields,
      include: {
        lifecycleStage: { select: { id: true, name: true, color: true, emoji: true } },
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      },
    });
  }

  async deleteContact(tenantId, id) {
    const exists = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!exists) return false;
    await prisma.contact.delete({ where: { id } });
    return true;
  }

  // Upsert contact by phone (used by webhook auto-create)
  async upsertByPhone(tenantId, phoneNumber, data = {}) {
    return prisma.contact.upsert({
      where: { tenantId_phoneNumber: { tenantId, phoneNumber } },
      create: { tenantId, phoneNumber, source: 'whatsapp', ...data },
      update: data.name ? { name: data.name } : {},
    });
  }

  // Notes
  async addNote(tenantId, contactId, userId, content) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } });
    if (!contact) return null;
    return prisma.contactNote.create({ data: { contactId, userId, content } });
  }

  async deleteNote(tenantId, noteId) {
    const note = await prisma.contactNote.findFirst({
      where: { id: noteId },
      include: { contact: { select: { tenantId: true } } },
    });
    if (!note || note.contact.tenantId !== tenantId) return false;
    await prisma.contactNote.delete({ where: { id: noteId } });
    return true;
  }

  // Labels CRUD
  async listLabels(tenantId) {
    return prisma.contactLabel.findMany({
      where: { tenantId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createLabel(tenantId, name, color) {
    return prisma.contactLabel.create({ data: { tenantId, name, color } });
  }

  async updateLabel(tenantId, id, data) {
    const exists = await prisma.contactLabel.findFirst({ where: { id, tenantId } });
    if (!exists) return null;
    return prisma.contactLabel.update({ where: { id }, data });
  }

  async deleteLabel(tenantId, id) {
    const exists = await prisma.contactLabel.findFirst({ where: { id, tenantId } });
    if (!exists) return false;
    await prisma.contactLabel.delete({ where: { id } });
    return true;
  }

  // Bulk import from parsed rows [{phoneNumber, name, email, ...}]
  async bulkImport(tenantId, rows) {
    let created = 0, updated = 0, failed = 0;
    for (const row of rows) {
      try {
        const phone = String(row.phoneNumber || row.phone || row.number || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 7) { failed++; continue; }
        const existing = await prisma.contact.findFirst({ where: { tenantId, phoneNumber: phone } });
        if (existing) {
          await prisma.contact.update({ where: { id: existing.id }, data: { name: row.name || existing.name, email: row.email || existing.email } });
          updated++;
        } else {
          await prisma.contact.create({ data: { tenantId, phoneNumber: phone, name: row.name, email: row.email, source: 'import' } });
          created++;
        }
      } catch { failed++; }
    }
    return { created, updated, failed };
  }

  // Activity log
  async logActivity(tenantId, { contactId, conversationId, userId, agentId, actionType, description, metadata }) {
    return prisma.activityLog.create({
      data: { tenantId, contactId, conversationId, userId, agentId, actionType, description, metadata },
    });
  }

  async getActivityLogs(tenantId, { contactId, conversationId, limit = 30 }) {
    const where = { tenantId };
    if (contactId) where.contactId = contactId;
    if (conversationId) where.conversationId = conversationId;
    return prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit });
  }
}

module.exports = new CrmService();
