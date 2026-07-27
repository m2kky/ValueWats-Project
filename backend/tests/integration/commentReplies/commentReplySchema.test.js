const fs = require('node:fs');
const path = require('node:path');
const { createTestDatabase, resetDatabase } = require('../../helpers/database');

const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
const migrationPath = path.resolve(
  __dirname,
  '../../../prisma/migrations/20260806030000_add_comment_reply_engine/migration.sql'
);

describe('Comment Reply schema', () => {
  it('defines the six Comment Reply models, required enum values, and operational constraints', () => {
    const schema = fs.readFileSync(schemaPath, 'utf8');

    for (const model of [
      'CommentReplyProfile',
      'CommentChannelBinding',
      'CommentReplyRule',
      'CommentReplyVariant',
      'CommentPostOverride',
      'CommentReplyExecution'
    ]) {
      expect(schema).toContain(`model ${model} {`);
    }

    expect(schema).toMatch(/enum CommentReplyExecutionStatus \{[\s\S]*received[\s\S]*skipped[\s\S]*processing[\s\S]*ready[\s\S]*failed[\s\S]*\}/);
    expect(schema).toMatch(/enum CommentReplyPlatform \{[\s\S]*facebook[\s\S]*instagram[\s\S]*\}/);
    expect(schema).toMatch(/enum OutboxStatus \{[\s\S]*cancelled[\s\S]*\}/);
    expect(schema).toContain('@@unique([tenantId, agentId])');
    expect(schema).toContain('@@unique([tenantId, instanceId])');
    expect(schema).toContain('@@unique([provider, externalAccountId])');
    expect(schema).toContain('@@unique([tenantId, bindingId, externalPostId])');
    expect(schema).toContain('@@unique([platform, providerAccountId, externalCommentId])');
    expect(schema).toContain('@@index([status, availableAt])');
    expect(schema).toContain('@@index([status, leaseExpiresAt])');
    expect(schema).toContain('@@index([tenantId, profileId, receivedAt(sort: Desc)])');
    expect(schema).toMatch(/sharedRotationCursor\s+Int/);
    expect(schema).toMatch(/facebookRotationCursor\s+Int/);
    expect(schema).toMatch(/instagramRotationCursor\s+Int/);
    expect(schema).toMatch(/leaseToken\s+String\?/);
    expect(schema).toMatch(/outboxEventId\s+String\?\s+@unique/);
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
    expect(migration).toMatch(/comment_reply_executions_[a-z_]+_fkey"\n\s+FOREIGN KEY \([^)]*\) REFERENCES [^;]+ ON DELETE SET NULL/g);
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
});
