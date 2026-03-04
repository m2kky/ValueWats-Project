const prisma = require('../config/database');
const integrationService = require('./integration.service');

class WorkflowService {

  /**
   * Trigger a workflow by ID
   * @param {string} workflowId 
   * @param {object} context - { contact, agent, conversation, message }
   */
  async executeWorkflow(workflowId, context) {
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow || !workflow.isActive) {
      console.warn(`[Workflow] Workflow ${workflowId} not found or inactive`);
      return;
    }

    // Create Execution Record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        conversationId: context.conversation?.id,
        status: 'pending',
        input: JSON.stringify({
          contactName: context.contact?.name,
          contactNumber: context.contact?.number,
          agentName: context.agent?.name
        })
      }
    });

    try {
      const steps = JSON.parse(workflow.steps || '[]');
      console.log(`[Workflow] Executing ${workflow.name} (${steps.length} steps)`);

      const results = {};

      for (const step of steps) {
        // Step format: { id: 'step1', integrationId: '...', action: '...', params: {...} }
        console.log(`[Workflow] Running step: ${step.action}`);

        // Replace variables in params
        const params = this.replaceVariables(step.params, context, results);

        // Execute via Integration Service
        const result = await integrationService.executeAction(
          step.integrationId,
          step.action,
          params
        );

        results[step.id] = result;

        // Log step success
        await prisma.workflowLog.create({
          data: {
            executionId: execution.id,
            level: 'info',
            message: `Step ${step.id} (${step.action}) completed`,
            details: JSON.stringify(result)
          }
        });
      }

      // Mark Complete
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          completedAt: new Date(),
          output: JSON.stringify(results)
        }
      });

      console.log(`[Workflow] Execution ${execution.id} completed successfully`);

    } catch (error) {
      console.error(`[Workflow] Execution ${execution.id} failed:`, error);

      await prisma.workflowLog.create({
        data: {
          executionId: execution.id,
          level: 'error',
          message: error.message,
          details: error.stack
        }
      });

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message
        }
      });
    }
  }

  /**
   * Replace {{variable}} placeholders in object values
   */
  replaceVariables(params, context, previousResults) {
    if (!params) return {};

    const jsonStr = JSON.stringify(params);
    const replacedStr = jsonStr.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(path.trim(), { ...context, steps: previousResults });
      return value !== undefined ? value : match;
    });

    return JSON.parse(replacedStr);
  }

  getValueByPath(path, obj) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}

module.exports = new WorkflowService();
