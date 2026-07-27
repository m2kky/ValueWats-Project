const prisma = require('../src/config/database');
const { encryptMetaToken, isEncryptedMetaToken } = require('../src/meta/metaTokenCrypto');

const metaChannelTypes = ['messenger', 'instagram', 'whatsapp_cloud'];
const dryRun = process.argv.includes('--dry-run');

async function migrate() {
  const instances = await prisma.instance.findMany({
    where: {
      channelType: { in: metaChannelTypes },
      accessToken: { not: null }
    },
    select: { id: true, accessToken: true }
  });
  const plaintextInstances = instances.filter((instance) => !isEncryptedMetaToken(instance.accessToken));
  const alreadyEncrypted = instances.length - plaintextInstances.length;

  if (!dryRun && plaintextInstances.length) {
    await prisma.$transaction(async (transaction) => {
      for (const instance of plaintextInstances) {
        const updated = await transaction.instance.updateMany({
          where: { id: instance.id, accessToken: instance.accessToken },
          data: { accessToken: encryptMetaToken(instance.accessToken) }
        });
        if (updated.count !== 1) throw new Error('Meta token migration failed');
      }
    });
  }

  console.log(`scanned=${instances.length}`);
  console.log(`alreadyEncrypted=${alreadyEncrypted}`);
  console.log(`${dryRun ? 'wouldEncrypt' : 'encrypted'}=${plaintextInstances.length}`);
}

migrate()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
