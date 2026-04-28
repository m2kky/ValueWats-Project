const Queue = require('bull');
const { redisConfig } = require('../config/redis');

// Lazy loading to prevent circular dependencies
let workflowService = null;

const workflowQueue = new Queue('workflow-jobs', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

workflowQueue.process(async (job) => {
  const { executionId, stepId } = job.data;
  console.log(`[WorkflowQueue] Processing delayed job for execution ${executionId}, resuming at step ${stepId}`);

  try {
    if (!workflowService) {
      workflowService = require('./workflow.service');
    }

    // Call resumeWorkflow
    await workflowService.resumeWorkflow(executionId, {});
    return { success: true };
  } catch (err) {
    console.error(`[WorkflowQueue] Error resuming workflow ${executionId}:`, err.message);
    throw err;
  }
});

workflowQueue.on('failed', (job, err) => {
  console.error(`[WorkflowQueue] Job ${job.id} failed:`, err.message);
});

module.exports = {
  workflowQueue
};
