const fs = require('node:fs');
const path = require('node:path');
const { createTestDatabase, resetDatabase } = require('../../helpers/database');

const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
const migrationPath = path.resolve(
  __dirname,
  '../../../prisma/migrations/20260806030000_add_comment_reply_engine/migration.sql'
);

function extractModelBlock(schema, modelName) {
  const match = schema.match(new RegExp(`^model ${modelName} \\{([\\s\\S]*?)^\\}`, 'm'));
  expect(match, `Missing ${modelName} model block`).not.toBeNull();
  return match[1];
}

function expectModelFields(modelBlock, fields) {
  for (const [field, type] of fields) {
    const escapedType = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(modelBlock).toMatch(new RegExp(`^\\s*${field}\\s+${escapedType}(?:\\s|$)`, 'm'));
  }
}

describe('Comment Reply schema', () => {
  it('defines the six Comment Reply models, required enum values, and operational constraints', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const modelNames = [
      'CommentReplyProfile',
      'CommentChannelBinding',
      'CommentReplyRule',
      'CommentReplyVariant',
      'CommentPostOverride',
      'CommentReplyExecution'
    ];
    const declaredModels = [...schema.matchAll(/^model (CommentReply\w+|CommentChannelBinding|CommentPostOverride) \{/gm)]
      .map((match) => match[1]);

    expect(declaredModels).toEqual(modelNames);

    expect(schema).toMatch(/enum CommentReplyExecutionStatus \{[\s\S]*received[\s\S]*skipped[\s\S]*processing[\s\S]*ready[\s\S]*failed[\s\S]*\}/);
    expect(schema).toMatch(/enum CommentReplyPlatform \{[\s\S]*facebook[\s\S]*instagram[\s\S]*\}/);
    expect(schema).toMatch(/enum OutboxStatus \{[\s\S]*cancelled[\s\S]*\}/);

    const profile = extractModelBlock(schema, 'CommentReplyProfile');
    expectModelFields(profile, [
      ['id', 'String'], ['tenantId', 'String'], ['agentId', 'String'], ['isEnabled', 'Boolean'],
      ['aiFallbackEnabled', 'Boolean'], ['defaultMatchMode', 'String'], ['configVersion', 'Int'],
      ['deletedAt', 'DateTime?'], ['createdAt', 'DateTime'], ['updatedAt', 'DateTime'],
      ['tenant', 'Tenant'], ['agent', 'AIAgent'], ['bindings', 'CommentChannelBinding[]'],
      ['rules', 'CommentReplyRule[]'], ['postOverrides', 'CommentPostOverride[]'],
      ['executions', 'CommentReplyExecution[]']
    ]);
    expect(profile).toContain('@@unique([tenantId, agentId])');
    expect(profile).toContain('@@map("comment_reply_profiles")');

    const binding = extractModelBlock(schema, 'CommentChannelBinding');
    expectModelFields(binding, [
      ['id', 'String'], ['tenantId', 'String'], ['profileId', 'String'], ['instanceId', 'String'],
      ['provider', 'String'], ['externalAccountId', 'String'], ['isEnabled', 'Boolean'],
      ['permissionState', 'String'], ['lastPermissionCheckAt', 'DateTime?'], ['createdAt', 'DateTime'],
      ['updatedAt', 'DateTime'], ['tenant', 'Tenant'], ['profile', 'CommentReplyProfile'],
      ['instance', 'Instance'], ['postOverrides', 'CommentPostOverride[]'], ['executions', 'CommentReplyExecution[]']
    ]);
    expect(binding).toContain('@@unique([tenantId, instanceId])');
    expect(binding).toContain('@@unique([provider, externalAccountId])');
    expect(binding).toContain('@@map("comment_channel_bindings")');

    const rule = extractModelBlock(schema, 'CommentReplyRule');
    expectModelFields(rule, [
      ['id', 'String'], ['tenantId', 'String'], ['profileId', 'String'], ['name', 'String'],
      ['isEnabled', 'Boolean'], ['priority', 'Int'], ['matchMode', 'String'], ['keywords', 'String[]'],
      ['sharedRotationCursor', 'Int'], ['facebookRotationCursor', 'Int'], ['instagramRotationCursor', 'Int'],
      ['deletedAt', 'DateTime?'], ['createdAt', 'DateTime'], ['updatedAt', 'DateTime'],
      ['tenant', 'Tenant'], ['profile', 'CommentReplyProfile'], ['variants', 'CommentReplyVariant[]'],
      ['executions', 'CommentReplyExecution[]']
    ]);
    expect(rule).toContain('@@index([profileId, deletedAt, isEnabled, priority])');
    expect(rule).toContain('@@map("comment_reply_rules")');

    const variant = extractModelBlock(schema, 'CommentReplyVariant');
    expectModelFields(variant, [
      ['id', 'String'], ['tenantId', 'String'], ['ruleId', 'String'], ['platform', 'CommentReplyPlatform?'],
      ['body', 'String'], ['orderIndex', 'Int'], ['isEnabled', 'Boolean'], ['deletedAt', 'DateTime?'],
      ['createdAt', 'DateTime'], ['updatedAt', 'DateTime'], ['tenant', 'Tenant'], ['rule', 'CommentReplyRule'],
      ['executions', 'CommentReplyExecution[]']
    ]);
    expect(variant).toContain('@@map("comment_reply_variants")');

    const postOverride = extractModelBlock(schema, 'CommentPostOverride');
    expectModelFields(postOverride, [
      ['id', 'String'], ['tenantId', 'String'], ['bindingId', 'String'], ['externalPostId', 'String'],
      ['mode', 'String'], ['overrideProfileId', 'String?'], ['postName', 'String?'], ['thumbnailUrl', 'String?'],
      ['postPublishedAt', 'DateTime?'], ['createdAt', 'DateTime'], ['updatedAt', 'DateTime'],
      ['tenant', 'Tenant'], ['binding', 'CommentChannelBinding'], ['overrideProfile', 'CommentReplyProfile?']
    ]);
    expect(postOverride).toContain('@@unique([tenantId, bindingId, externalPostId])');
    expect(postOverride).toContain('@@map("comment_post_overrides")');

    const execution = extractModelBlock(schema, 'CommentReplyExecution');
    expectModelFields(execution, [
      ['id', 'String'], ['tenantId', 'String'], ['instanceId', 'String?'], ['bindingId', 'String?'],
      ['profileId', 'String?'], ['agentId', 'String?'], ['agentNameSnapshot', 'String?'],
      ['platform', 'CommentReplyPlatform'], ['providerAccountId', 'String'], ['externalCommentId', 'String'],
      ['externalPostId', 'String'], ['parentCommentId', 'String?'], ['commentText', 'String?'],
      ['commenterExternalId', 'String?'], ['commenterName', 'String?'], ['postName', 'String?'],
      ['eventCreatedAt', 'DateTime?'], ['isSelf', 'Boolean'], ['skipReason', 'String?'],
      ['routeSource', 'String?'], ['ruleId', 'String?'], ['ruleNameSnapshot', 'String?'],
      ['variantId', 'String?'], ['profileConfigVersion', 'Int?'], ['agentConfigVersion', 'Int?'],
      ['renderedReply', 'String?'], ['status', 'CommentReplyExecutionStatus'], ['providerReplyId', 'String?'],
      ['errorCode', 'String?'], ['errorMessage', 'String?'], ['attempts', 'Int'], ['availableAt', 'DateTime'],
      ['leaseExpiresAt', 'DateTime?'], ['leaseToken', 'String?'], ['outboxEventId', 'String?'],
      ['receivedAt', 'DateTime'], ['completedAt', 'DateTime?'], ['createdAt', 'DateTime'], ['updatedAt', 'DateTime'],
      ['tenant', 'Tenant'], ['instance', 'Instance?'], ['binding', 'CommentChannelBinding?'],
      ['profile', 'CommentReplyProfile?'], ['agent', 'AIAgent?'], ['rule', 'CommentReplyRule?'],
      ['variant', 'CommentReplyVariant?'], ['outboxEvent', 'OutboxEvent?']
    ]);
    expect(execution).toContain('outboxEventId        String?                     @unique');
    expect(execution).toContain('@@unique([platform, providerAccountId, externalCommentId])');
    expect(execution).toContain('@@index([status, availableAt])');
    expect(execution).toContain('@@index([status, leaseExpiresAt])');
    expect(execution).toContain('@@index([tenantId, profileId, receivedAt(sort: Desc)])');
    expect(execution).toContain('@@index([tenantId, profileId, createdAt(sort: Desc), id])');
    expect(execution).toContain('@@map("comment_reply_executions")');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migration = fs.readFileSync(migrationPath, 'utf8');
    for (const table of [
      'comment_reply_profiles',
      'comment_channel_bindings',
      'comment_reply_rules',
      'comment_reply_variants',
      'comment_post_overrides',
      'comment_reply_executions'
    ]) {
      expect(migration).toContain(`CREATE TABLE "${table}"`);
    }

    expect(migration).toContain('ADD VALUE IF NOT EXISTS \'cancelled\'');
    expect(migration).toContain('comment_reply_profiles_tenant_id_agent_id_key');
    expect(migration).toContain('comment_channel_bindings_tenant_id_instance_id_key');
    expect(migration).toContain('comment_channel_bindings_provider_external_account_id_key');
    expect(migration).toContain('comment_post_overrides_tenant_id_binding_id_external_post_id_key');
    expect(migration).toContain('comment_reply_executions_platform_provider_account_id_external_comment_id_key');
    expect(migration).toContain('comment_reply_executions_status_available_at_idx');
    expect(migration).toContain('comment_reply_executions_status_lease_expires_at_idx');
    expect(migration).toContain('comment_reply_executions_tenant_id_profile_id_received_at_idx');

    const executionSetNullFks = [...migration.matchAll(
      /ADD CONSTRAINT "comment_reply_executions_([a-z_]+)_fkey"\n\s+FOREIGN KEY \("[a-z_]+"\) REFERENCES "[A-Za-z_]+"\("id"\) ON DELETE SET NULL ON UPDATE CASCADE/g
    )].map((match) => match[1]);
    expect(executionSetNullFks).toEqual([
      'instance_id',
      'binding_id',
      'profile_id',
      'agent_id',
      'rule_id',
      'variant_id',
      'outbox_event_id'
    ]);
  });
});

describe('Comment Reply execution deduplication', () => {
  const prisma = createTestDatabase(process.env.DATABASE_URL);
  let tenantId;

  beforeEach(async () => {
    await resetDatabase(prisma);
    tenantId = 'tenant-comment-replies';
    await prisma.tenant.create({
      data: { id: tenantId, name: 'Comment Reply Tenant', email: 'comment-replies@example.test' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deduplicates one provider comment globally', async () => {
    const data = {
      tenantId,
      platform: 'facebook',
      providerAccountId: 'page-1',
      externalCommentId: 'comment-1',
      externalPostId: 'post-1',
      status: 'received',
      receivedAt: new Date(),
      availableAt: new Date()
    };

    await prisma.commentReplyExecution.create({ data });
    await expect(prisma.commentReplyExecution.create({ data })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects a provider account binding already owned by another tenant', async () => {
    await resetDatabase(prisma);

    try {
      const tenants = await Promise.all([
        prisma.tenant.create({
          data: { id: 'tenant-comment-binding-a', name: 'Binding Tenant A', email: 'binding-a@example.test' }
        }),
        prisma.tenant.create({
          data: { id: 'tenant-comment-binding-b', name: 'Binding Tenant B', email: 'binding-b@example.test' }
        })
      ]);

      const agents = await Promise.all(tenants.map((tenant, index) => prisma.aIAgent.create({
        data: {
          id: `agent-comment-binding-${index + 1}`,
          tenantId: tenant.id,
          name: `Binding Agent ${index + 1}`,
          instructions: 'Reply to public comments.'
        }
      })));
      const instances = await Promise.all(tenants.map((tenant, index) => prisma.instance.create({
        data: {
          id: `instance-comment-binding-${index + 1}`,
          tenantId: tenant.id,
          channelType: 'messenger',
          instanceName: `Binding Page ${index + 1}`,
          status: 'connected'
        }
      })));
      const profiles = await Promise.all(tenants.map((tenant, index) => prisma.commentReplyProfile.create({
        data: {
          id: `profile-comment-binding-${index + 1}`,
          tenantId: tenant.id,
          agentId: agents[index].id
        }
      })));

      await prisma.commentChannelBinding.create({
        data: {
          tenantId: tenants[0].id,
          profileId: profiles[0].id,
          instanceId: instances[0].id,
          provider: 'facebook',
          externalAccountId: 'shared-page-account'
        }
      });

      await expect(prisma.commentChannelBinding.create({
        data: {
          tenantId: tenants[1].id,
          profileId: profiles[1].id,
          instanceId: instances[1].id,
          provider: 'facebook',
          externalAccountId: 'shared-page-account'
        }
      })).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      await resetDatabase(prisma);
    }
  });
});
