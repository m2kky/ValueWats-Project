const { CommandError, COMMAND_ERROR_CODES } = require('../agents/commands/commandErrors');

const STANDARD_FIELDS = new Set([
  'name', 'email', 'gender', 'birthDate', 'governorate', 'district', 'address'
]);

function denied(message) {
  throw new CommandError(COMMAND_ERROR_CODES.ARGUMENTS_INVALID, message);
}

function createContactMutationService(prisma) {
  async function load(context) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: context.conversationId, tenantId: context.tenantId },
      include: { contact: true }
    });
    if (!conversation) throw new CommandError(COMMAND_ERROR_CODES.TENANT_MISMATCH);

    let contact = conversation.contact;
    if (!contact) {
      contact = await prisma.contact.upsert({
        where: {
          tenantId_phoneNumber: {
            tenantId: context.tenantId,
            phoneNumber: conversation.contactNumber
          }
        },
        update: {},
        create: {
          tenantId: context.tenantId,
          phoneNumber: conversation.contactNumber,
          name: conversation.contactName || 'Unknown',
          source: conversation.channelType || 'manual'
        }
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { contactId: contact.id }
      });
    }
    return { contact, conversation };
  }

  async function updateContact(context, updates) {
    const { contact, conversation } = await load(context);
    const definitions = await prisma.contactFieldDefinition.findMany({
      where: { tenantId: context.tenantId },
      select: { key: true }
    });
    const customKeys = new Set(definitions.map(({ key }) => key));
    const standard = {};
    const custom = { ...(contact.customFields || {}) };

    for (const { field, value } of updates) {
      if (STANDARD_FIELDS.has(field)) {
        standard[field] = field === 'birthDate' && value ? new Date(value) : value || null;
      } else if (customKeys.has(field)) {
        custom[field] = value;
      } else {
        denied(`Contact field is not allowed: ${field}`);
      }
    }
    if (standard.birthDate instanceof Date && Number.isNaN(standard.birthDate.getTime())) {
      denied('Invalid birthDate');
    }

    await prisma.contact.update({
      where: { id: contact.id },
      data: { ...standard, customFields: custom }
    });
    if (standard.name !== undefined) {
      await prisma.conversation.updateMany({
        where: { contactId: contact.id, tenantId: context.tenantId },
        data: { contactName: standard.name }
      });
    }
    for (const { field, value } of updates) {
      await prisma.contactField.upsert({
        where: {
          tenantId_contactNumber_fieldName: {
            tenantId: context.tenantId,
            contactNumber: conversation.contactNumber,
            fieldName: field
          }
        },
        update: { fieldValue: value },
        create: {
          tenantId: context.tenantId,
          contactNumber: conversation.contactNumber,
          fieldName: field,
          fieldValue: value
        }
      });
    }
    return { contactId: contact.id, updatedFields: updates.map(({ field }) => field) };
  }

  async function updateLifecycle(context, stageValue) {
    const { contact, conversation } = await load(context);
    const stage = await prisma.lifecycleStage.findFirst({
      where: {
        tenantId: context.tenantId,
        OR: [
          { id: stageValue },
          { name: { equals: stageValue, mode: 'insensitive' } }
        ]
      }
    });
    if (!stage) denied('Lifecycle stage not found');
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lifecycleStageId: stage.id }
    });
    await prisma.conversation.updateMany({
      where: { contactId: contact.id, tenantId: context.tenantId },
      data: { lifecycleStageId: stage.id }
    });
    await prisma.activityLog.create({
      data: {
        tenantId: context.tenantId,
        contactId: contact.id,
        conversationId: conversation.id,
        agentId: context.sourceAgentId,
        actionType: 'lifecycle_change',
        description: `AI agent changed lifecycle to "${stage.name}"`
      }
    });
    return { contactId: contact.id, lifecycleStageId: stage.id };
  }

  async function modifyTags(context, { operation, tag }) {
    const { contact, conversation } = await load(context);
    const label = await prisma.contactLabel.findFirst({
      where: {
        tenantId: context.tenantId,
        OR: [{ id: tag }, { name: { equals: tag, mode: 'insensitive' } }]
      }
    });
    if (!label) denied('Tag not found');
    const where = { contactId_labelId: { contactId: contact.id, labelId: label.id } };
    if (operation === 'add') {
      await prisma.contactLabelAssignment.upsert({
        where,
        update: {},
        create: { contactId: contact.id, labelId: label.id }
      });
    } else {
      await prisma.contactLabelAssignment.deleteMany({
        where: { contactId: contact.id, labelId: label.id }
      });
    }
    const assignments = await prisma.contactLabelAssignment.findMany({
      where: { contactId: contact.id },
      include: { label: { select: { name: true } } }
    });
    await prisma.conversation.updateMany({
      where: { contactId: contact.id, tenantId: context.tenantId },
      data: { labels: assignments.map(({ label: item }) => item.name) }
    });
    await prisma.activityLog.create({
      data: {
        tenantId: context.tenantId,
        contactId: contact.id,
        conversationId: conversation.id,
        agentId: context.sourceAgentId,
        actionType: operation === 'add' ? 'label_added' : 'label_removed',
        description: `AI agent ${operation === 'add' ? 'added' : 'removed'} tag "${label.name}"`
      }
    });
    return { contactId: contact.id, labelId: label.id, operation };
  }

  async function addInternalComment(context, content) {
    const { contact, conversation } = await load(context);
    const note = await prisma.contactNote.create({
      data: { contactId: contact.id, agentId: context.sourceAgentId, content }
    });
    await prisma.activityLog.create({
      data: {
        tenantId: context.tenantId,
        contactId: contact.id,
        conversationId: conversation.id,
        agentId: context.sourceAgentId,
        actionType: 'note_added',
        description: 'AI agent added an internal comment'
      }
    });
    return { contactId: contact.id, noteId: note.id };
  }

  return Object.freeze({ addInternalComment, modifyTags, updateContact, updateLifecycle });
}

module.exports = { createContactMutationService };
