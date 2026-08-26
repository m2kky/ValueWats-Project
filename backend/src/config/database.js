const { PrismaClient } = require('@prisma/client');
const { AsyncLocalStorage } = require('async_hooks');

const tenantStorage = new AsyncLocalStorage();

const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = tenantStorage.getStore();
        
        // If no tenant context is active (e.g., system jobs, webhooks), 
        // proceed with the explicit query args
        if (!tenantId) {
          return query(args);
        }

        // List of models that are tenant-isolated
        const tenantModels = [
          'Instance', 'Contact', 'Message', 'Campaign', 'Conversation',
          'Agent', 'Template', 'Integration', 'Tag', 'Segment', 'StoreProduct'
        ];

        // Skip if model is not tenant-isolated (e.g., Tenant model itself, Admin logs)
        if (!tenantModels.includes(model)) {
          return query(args);
        }

        // Methods that take a 'where' clause
        if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count'].includes(operation)) {
          args.where = { ...args.where, tenantId };
        }

        return query(args);
      },
    },
  },
});

// Export both the extended Prisma client and the AsyncLocalStorage store
module.exports = prisma;
module.exports.tenantStorage = tenantStorage;
