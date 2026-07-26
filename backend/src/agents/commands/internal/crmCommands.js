const base = {
  risk: 'crm_write',
  delivery: 'internal',
  terminalConversationCommand: false
};

const updateContactCommand = Object.freeze({
  ...base,
  type: 'update_contact',
  capabilityType: 'update_contact',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['updates'],
    properties: {
      updates: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['field', 'value'],
          properties: {
            field: { type: 'string', minLength: 1, maxLength: 100 },
            value: { type: 'string', maxLength: 5000 }
          }
        }
      }
    }
  },
  execute: (scope, context, args) => scope.updateContact(context, args.updates)
});

const updateLifecycleCommand = Object.freeze({
  ...base,
  type: 'update_lifecycle',
  capabilityType: 'update_lifecycle',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['stage'],
    properties: { stage: { type: 'string', minLength: 1, maxLength: 200 } }
  },
  execute: (scope, context, args) => scope.updateLifecycle(context, args.stage)
});

const modifyTagsCommand = Object.freeze({
  ...base,
  type: 'modify_tags',
  capabilityType: 'modify_tags',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['operation', 'tag'],
    properties: {
      operation: { type: 'string', enum: ['add', 'remove'] },
      tag: { type: 'string', minLength: 1, maxLength: 200 }
    }
  },
  execute: (scope, context, args) => scope.modifyTags(context, args)
});

const addInternalCommentCommand = Object.freeze({
  ...base,
  type: 'add_internal_comment',
  capabilityType: 'add_internal_comment',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['content'],
    properties: { content: { type: 'string', minLength: 1, maxLength: 5000 } }
  },
  execute: (scope, context, args) => scope.addInternalComment(context, args.content)
});

module.exports = {
  addInternalCommentCommand,
  modifyTagsCommand,
  updateContactCommand,
  updateLifecycleCommand
};
