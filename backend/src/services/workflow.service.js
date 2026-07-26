const axios = require('axios');
const prisma = require('../config/database');
const chatService = require('./chat.service');
const integrationService = require('./integration.service');
const {
  conversationOwnershipGateway
} = require('../conversations/conversationOwnershipGateway');

const MAX_STEPS_PER_RUN = 200;
const MAX_DELAY_SECONDS = 30;

class WorkflowService {
  safeJsonParse(value, fallback) {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  async logExecution(executionId, level, message, details = null) {
    await prisma.workflowLog.create({
      data: {
        executionId,
        level,
        message,
        details: details ? JSON.stringify(details) : null
      }
    });
  }

  normalizeSteps(rawSteps) {
    const steps = Array.isArray(rawSteps) ? rawSteps : [];
    return steps.map((step, index) => ({
      id: step?.id || `step_${index + 1}`,
      ...step
    }));
  }

  getValueByPath(path, obj) {
    if (!path) return undefined;
    return String(path)
      .split('.')
      .reduce((acc, part) => (acc === undefined || acc === null ? undefined : acc[part]), obj);
  }

  resolveTemplateString(template, scope) {
    if (typeof template !== 'string') return template;

    const exact = template.match(/^\s*\{\{([^}]+)\}\}\s*$/);
    if (exact) {
      const value = this.getValueByPath(exact[1].trim(), scope);
      return value === undefined ? template : value;
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (_match, rawPath) => {
      const value = this.getValueByPath(String(rawPath).trim(), scope);
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  }

  resolveObject(value, scope) {
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveObject(item, scope));
    }

    if (value && typeof value === 'object') {
      const out = {};
      for (const [key, val] of Object.entries(value)) {
        out[key] = this.resolveObject(val, scope);
      }
      return out;
    }

    return this.resolveTemplateString(value, scope);
  }

  toNumber(value, fallback = 0) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  evaluateSingleCondition(condition, scope) {
    const leftRaw = condition?.left ?? condition?.path ?? condition?.field ?? '';
    const operator = String(condition?.operator || 'equals').toLowerCase();
    const rightRaw = condition?.right ?? condition?.value;

    const leftValue = this.resolveTemplateString(String(leftRaw), scope);
    const rightValue = this.resolveObject(rightRaw, scope);

    const leftString = leftValue === null || leftValue === undefined ? '' : String(leftValue);
    const rightString = rightValue === null || rightValue === undefined ? '' : String(rightValue);

    switch (operator) {
      case 'equals':
      case 'eq':
        return leftString.toLowerCase() === rightString.toLowerCase();
      case 'not_equals':
      case 'neq':
        return leftString.toLowerCase() !== rightString.toLowerCase();
      case 'contains':
        return leftString.toLowerCase().includes(rightString.toLowerCase());
      case 'not_contains':
        return !leftString.toLowerCase().includes(rightString.toLowerCase());
      case 'starts_with':
        return leftString.toLowerCase().startsWith(rightString.toLowerCase());
      case 'ends_with':
        return leftString.toLowerCase().endsWith(rightString.toLowerCase());
      case 'exists':
        return leftValue !== undefined && leftValue !== null && leftString.trim() !== '';
      case 'not_exists':
        return leftValue === undefined || leftValue === null || leftString.trim() === '';
      case 'gt':
      case 'greater_than':
        return this.toNumber(leftValue, Number.NEGATIVE_INFINITY) > this.toNumber(rightValue, Number.POSITIVE_INFINITY);
      case 'gte':
      case 'greater_or_equal':
        return this.toNumber(leftValue, Number.NEGATIVE_INFINITY) >= this.toNumber(rightValue, Number.POSITIVE_INFINITY);
      case 'lt':
      case 'less_than':
        return this.toNumber(leftValue, Number.POSITIVE_INFINITY) < this.toNumber(rightValue, Number.NEGATIVE_INFINITY);
      case 'lte':
      case 'less_or_equal':
        return this.toNumber(leftValue, Number.POSITIVE_INFINITY) <= this.toNumber(rightValue, Number.NEGATIVE_INFINITY);
      default:
        return false;
    }
  }

  evaluateConditions(conditions, logic, scope) {
    const list = Array.isArray(conditions) ? conditions : [];
    if (!list.length) return false;

    const normalizedLogic = String(logic || 'and').toLowerCase();
    if (normalizedLogic === 'or') {
      return list.some((condition) => this.evaluateSingleCondition(condition, scope));
    }
    return list.every((condition) => this.evaluateSingleCondition(condition, scope));
  }

  resolvePointerToIndex(pointer, steps, indexById) {
    if (pointer === null || pointer === undefined || pointer === '') return null;

    if (typeof pointer === 'number') {
      return pointer >= 0 && pointer < steps.length ? pointer : null;
    }

    const pointerText = String(pointer).trim();
    if (indexById.has(pointerText)) return indexById.get(pointerText);

    const asNumber = Number(pointerText);
    if (Number.isInteger(asNumber) && asNumber >= 0 && asNumber < steps.length) {
      return asNumber;
    }

    return null;
  }

  async ensureConversationContext(workflow, scope, preferredInstanceId = null) {
    const conversationId = scope?.conversation?.id || scope?.conversationId;
    if (!conversationId) {
      throw new Error('Workflow action requires conversation context');
    }

    const conversation = scope.conversation || await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: workflow.tenantId }
    });

    if (!conversation) {
      throw new Error('Conversation context is invalid for this workflow');
    }

    let instanceId = preferredInstanceId || scope?.instance?.id || scope?.instanceId || scope?.message?.instanceId;
    if (!instanceId) {
      const channelInstance = await prisma.instance.findFirst({
        where: {
          tenantId: workflow.tenantId,
          status: 'connected',
          channelType: conversation.channelType
        },
        orderBy: { createdAt: 'asc' }
      });

      const fallbackInstance = channelInstance || await prisma.instance.findFirst({
        where: {
          tenantId: workflow.tenantId,
          status: 'connected'
        },
        orderBy: { createdAt: 'asc' }
      });

      instanceId = fallbackInstance?.id || null;
    }

    if (!instanceId) {
      throw new Error('No connected instance available for workflow action');
    }

    return { conversation, conversationId: conversation.id, instanceId };
  }

  async applyLabel(workflow, scope, labelName, shouldAdd) {
    const { conversation } = await this.ensureConversationContext(workflow, scope);
    const label = String(labelName || '').trim();
    if (!label) throw new Error('Label name is required');

    const currentLabels = Array.isArray(conversation.labels) ? [...conversation.labels] : [];
    const set = new Set(currentLabels.map((item) => String(item).trim()).filter(Boolean));
    if (shouldAdd) set.add(label);
    if (!shouldAdd) set.delete(label);

    const nextLabels = Array.from(set);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { labels: nextLabels }
    });

    if (conversation.contactId) {
      const labelRecord = await prisma.contactLabel.upsert({
        where: {
          tenantId_name: {
            tenantId: workflow.tenantId,
            name: label
          }
        },
        update: {},
        create: {
          tenantId: workflow.tenantId,
          name: label,
          color: '#6366f1'
        }
      });

      if (shouldAdd) {
        await prisma.contactLabelAssignment.upsert({
          where: {
            contactId_labelId: {
              contactId: conversation.contactId,
              labelId: labelRecord.id
            }
          },
          update: {},
          create: {
            contactId: conversation.contactId,
            labelId: labelRecord.id
          }
        });
      } else {
        await prisma.contactLabelAssignment.deleteMany({
          where: {
            contactId: conversation.contactId,
            labelId: labelRecord.id
          }
        });
      }
    }

    return { labels: nextLabels };
  }

  async executeStep(step, scope, workflow) {
    const actionType = step.data?.actionType || step.type;
    const config = step.data?.config || {};

    if (!actionType) throw new Error(`Step ${step.id} missing actionType`);

    if (actionType === 'send_message') {
      const messageText = this.resolveTemplateString(config.message || '', scope);
      if (!messageText.trim()) throw new Error(`Step ${step.id} requires message text`);

      const context = await this.ensureConversationContext(workflow, scope);
      const sent = await chatService.sendMessage(workflow.tenantId, {
        conversationId: context.conversationId,
        instanceId: context.instanceId,
        content: messageText,
        messageType: 'text'
      });
      return { result: { messageId: sent?.id } };
    }

    if (actionType === 'ask_question') {
      const messageText = this.resolveTemplateString(config.question || '', scope);
      if (!messageText.trim()) throw new Error(`Step ${step.id} requires question text`);

      const context = await this.ensureConversationContext(workflow, scope);
      await chatService.sendMessage(workflow.tenantId, {
        conversationId: context.conversationId,
        instanceId: context.instanceId,
        content: messageText,
        messageType: 'text'
      });

      // State Machine Pause
      return {
        pause: true,
        waitForReply: true,
        saveToVariable: config.saveToVariable,
        result: { asked: messageText }
      };
    }

    if (actionType === 'wait') {
      const duration = this.toNumber(config.duration, 1);
      const unit = config.unit || 'minutes';
      
      let delayMs = duration * 1000;
      if (unit === 'minutes') delayMs *= 60;
      if (unit === 'hours') delayMs *= 3600;
      if (unit === 'days') delayMs *= 86400;

      // State Machine Pause
      return { pause: true, delayMs, result: { delayed: `${duration} ${unit}` } };
    }

    if (actionType === 'branch') {
      const branches = step.data?.branches || [];
      for (const branch of branches) {
         if (!branch.conditions || branch.conditions.length === 0) continue;
         const passed = this.evaluateConditions(branch.conditions, 'and', scope);
         if (passed) return { result: { branch: branch.label }, handleId: branch.id };
      }
      return { result: { branch: 'else' }, handleId: 'else' };
    }

    if (actionType === 'update_tag') {
      const value = config.tag || config.label;
      return { result: await this.applyLabel(workflow, scope, value, true) };
    }

    if (actionType === 'update_lifecycle') {
      if (config.stageId) {
        const context = await this.ensureConversationContext(workflow, scope);
        await prisma.conversation.update({
          where: { id: context.conversationId },
          data: { lifecycleStageId: config.stageId }
        });
        if (context.conversation.contactId) {
          await prisma.contact.update({
            where: { id: context.conversation.contactId },
            data: { lifecycleStageId: config.stageId }
          }).catch(() => {});
        }
        return { result: { stageId: config.stageId } };
      }
    }

    if (actionType === 'update_field') {
      const field = config.field;
      const value = this.resolveTemplateString(config.value || '', scope);
      const context = await this.ensureConversationContext(workflow, scope);
      if (field && context.conversation.contactId) {
        if (field === 'name' || field === 'email' || field === 'phone') {
          await prisma.contact.update({ where: { id: context.conversation.contactId }, data: { [field]: value } });
        } else if (field.startsWith('custom.')) {
          const customKey = field.split('.')[1];
          const contact = await prisma.contact.findUnique({ where: { id: context.conversation.contactId } });
          const customFields = contact.customFields || {};
          customFields[customKey] = value;
          await prisma.contact.update({ where: { id: context.conversation.contactId }, data: { customFields } });
        }
        return { result: { field, value } };
      }
    }

    if (actionType === 'assign_to' || actionType === 'ai_agent') {
      const type = actionType === 'ai_agent' ? 'ai_agent' : (config.assignType || 'user');
      const userId = config.userId || null;
      const agentId = config.agentId || null;
      const context = await this.ensureConversationContext(workflow, scope);
      const updated = await chatService.updateAssignment(
        workflow.tenantId,
        context.conversationId,
        type === 'ai_agent'
          ? { type: 'agent', agentId }
          : { type: 'user', userId }
      );
      return {
        result: {
          currentAgentId: updated.currentAgentId,
          assignedUserId: updated.assignedUserId
        }
      };
    }

    if (actionType === 'jump_to') {
      if (config.targetNodeId) {
        return { jumpToNodeId: config.targetNodeId, result: { jumpedTo: config.targetNodeId } };
      }
    }

    if (actionType === 'trigger_workflow') {
      if (config.workflowId) {
        await this.executeWorkflow(config.workflowId, scope);
        return { result: { triggered: config.workflowId } };
      }
    }

    if (actionType === 'http_request') {
      let parsedHeaders = {};
      let parsedBody = {};
      try { if (config.headers) parsedHeaders = JSON.parse(config.headers); } catch(e){}
      try { if (config.body) parsedBody = JSON.parse(this.resolveTemplateString(config.body, scope)); } catch(e){}
      
      const url = this.resolveTemplateString(config.url || '', scope);
      if (url) {
        const response = await axios({ method: config.method || 'GET', url, headers: parsedHeaders, data: parsedBody }).catch(e => e.response);
        return { result: { status: response?.status, data: response?.data } };
      }
    }

    if (actionType === 'add_comment' || actionType === 'close_conversation') {
      const comment = this.resolveTemplateString(config.comment || '', scope);
      const context = await this.ensureConversationContext(workflow, scope);
      
      if (comment) {
        await prisma.message.create({
          data: {
            tenantId: workflow.tenantId,
            conversationId: context.conversationId,
            messageType: 'note',
            senderType: 'system',
            content: comment,
            status: 'sent'
          }
        });
      }

      if (actionType === 'close_conversation') {
        await conversationOwnershipGateway.close({
          tenantId: workflow.tenantId,
          conversationId: context.conversationId,
          reasonCode: 'workflow_close',
          reason: 'Workflow closed the conversation'
        });
      }
      return { result: { commentAdded: !!comment, closed: actionType === 'close_conversation' } };
    }

    if (actionType === 'google_sheets') {
      // In a full implementation, you would use googleapis and the integration tokens.
      // For now, we return a mock success or pass to an integration service.
      const sheetAction = config.sheetAction || 'add_row';
      return { result: { sheetAction, status: 'pending_integration_setup', spreadsheetId: config.spreadsheetId } };
    }

    // Fallback to legacy step handler for other operations temporarily
    return await this.__old_executeStep(step, scope, workflow);
  }

  async __old_executeStep(step, scope, workflow) {
    const stepType = String(
      step?.type || (step?.integrationId && step?.action ? 'legacy_integration_action' : '')
    ).toLowerCase();

    if (!stepType) {
      throw new Error(`Step ${step.id} is missing a type`);
    }

    if (stepType === 'legacy_integration_action' || stepType === 'integration_action') {
      const integrationId = step.integrationId || step?.params?.integrationId;
      const action = step.action || step?.params?.action;
      const paramsSource = step.params || {};
      if (!integrationId || !action) throw new Error(`Step ${step.id} missing integrationId/action`);
      const params = this.resolveObject(paramsSource, scope);
      const result = await integrationService.executeAction(integrationId, action, params);
      return { result };
    }

    if (stepType === 'send_message') {
      const params = this.resolveObject(step.params || {}, scope);
      const messageText = this.resolveTemplateString(step.text || params.text || '', scope);
      if (!String(messageText || '').trim()) {
        throw new Error(`Step ${step.id} requires text`);
      }

      const context = await this.ensureConversationContext(workflow, scope, step.instanceId || params.instanceId);
      const sent = await chatService.sendMessage(workflow.tenantId, {
        conversationId: context.conversationId,
        instanceId: context.instanceId,
        content: String(messageText),
        messageType: 'text'
      });

      return {
        result: {
          messageId: sent?.id || null,
          conversationId: context.conversationId,
          instanceId: context.instanceId
        }
      };
    }

    if (stepType === 'add_tag') {
      const params = this.resolveObject(step.params || {}, scope);
      const value = step.tag || params.tag || params.label;
      return { result: await this.applyLabel(workflow, scope, value, true) };
    }

    if (stepType === 'remove_tag') {
      const params = this.resolveObject(step.params || {}, scope);
      const value = step.tag || params.tag || params.label;
      return { result: await this.applyLabel(workflow, scope, value, false) };
    }

    if (stepType === 'set_lifecycle_stage') {
      const params = this.resolveObject(step.params || {}, scope);
      const stageId = step.stageId || params.stageId || null;
      const stageName = step.stageName || params.stageName || null;
      const context = await this.ensureConversationContext(workflow, scope);

      let targetStage = null;
      if (stageId) {
        targetStage = await prisma.lifecycleStage.findFirst({
          where: { id: stageId, tenantId: workflow.tenantId }
        });
      } else if (stageName) {
        const stages = await prisma.lifecycleStage.findMany({
          where: { tenantId: workflow.tenantId }
        });
        const normalizedTarget = String(stageName).trim().toLowerCase();
        targetStage = stages.find((stage) => String(stage.name).trim().toLowerCase() === normalizedTarget) || null;
      }

      if (!targetStage) {
        throw new Error(`Step ${step.id} could not resolve lifecycle stage`);
      }

      await prisma.conversation.update({
        where: { id: context.conversationId },
        data: { lifecycleStageId: targetStage.id }
      });

      if (context.conversation.contactId) {
        await prisma.contact.update({
          where: { id: context.conversation.contactId },
          data: { lifecycleStageId: targetStage.id }
        }).catch(() => {});
      }

      return { result: { stageId: targetStage.id, stageName: targetStage.name } };
    }

    if (stepType === 'assign_user') {
      const params = this.resolveObject(step.params || {}, scope);
      const userId = step.userId || params.userId || null;
      if (!userId) throw new Error(`Step ${step.id} requires userId`);
      const context = await this.ensureConversationContext(workflow, scope);
      const updated = await chatService.updateAssignment(workflow.tenantId, context.conversationId, { type: 'user', userId });
      return { result: { assignedUserId: updated.assignedUserId } };
    }

    if (stepType === 'webhook') {
      const params = this.resolveObject(step.params || {}, scope);
      const url = step.url || params.url;
      if (!url) throw new Error(`Step ${step.id} requires URL`);

      const method = String(step.method || params.method || 'POST').toUpperCase();
      const headers = { ...(params.headers || {}) };
      const body = params.body ?? null;
      const timeout = Math.min(Math.max(this.toNumber(params.timeoutMs, 15000), 1000), 30000);

      const response = await axios({
        method,
        url,
        headers,
        data: body,
        timeout
      });

      return {
        result: {
          status: response.status,
          data: response.data
        }
      };
    }

    if (stepType === 'delay') {
      const params = this.resolveObject(step.params || {}, scope);
      const seconds = Math.min(
        Math.max(this.toNumber(step.seconds ?? params.seconds ?? params.delaySeconds ?? 1, 1), 0),
        MAX_DELAY_SECONDS
      );
      if (seconds > 0) {
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      }
      return { result: { delayedSeconds: seconds } };
    }

    if (stepType === 'condition') {
      const params = this.resolveObject(step.params || {}, scope);
      const conditions = step.conditions || params.conditions || [];
      const logic = step.logic || params.logic || 'and';
      const passed = this.evaluateConditions(conditions, logic, scope);
      const nextPointer = passed
        ? (step.ifTrue ?? step.nextTrue ?? params.ifTrue ?? params.nextTrue ?? null)
        : (step.ifFalse ?? step.nextFalse ?? params.ifFalse ?? params.nextFalse ?? null);
      return { result: { passed }, nextPointer };
    }

    if (stepType === 'jump') {
      const params = this.resolveObject(step.params || {}, scope);
      const nextPointer = step.to ?? step.stepId ?? params.to ?? params.stepId ?? null;
      return { result: { jumpedTo: nextPointer }, nextPointer };
    }

    if (stepType === 'end') {
      return { result: { ended: true }, stop: true };
    }

    throw new Error(`Unknown step type: ${step.type}`);
  }

  buildScope(context, executionId, workflow, stepResults) {
    return {
      now: new Date().toISOString(),
      execution: { id: executionId },
      workflow: {
        id: workflow.id,
        name: workflow.name,
        triggerType: workflow.triggerType
      },
      ...context,
      steps: stepResults
    };
  }

  async resumeWorkflow(executionId, injectedContext = {}) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true }
    });

    if (!execution || execution.status !== 'paused') {
      throw new Error(`Execution ${executionId} is not paused`);
    }

    // Restore scope context
    let context = {};
    if (execution.contextData) {
      context = this.safeJsonParse(execution.contextData, {});
    }

    // Merge injected answers (like from ask_question)
    context = { ...context, ...injectedContext };

    // Resume Graph traversal
    const stepsData = this.safeJsonParse(execution.workflow.steps, { nodes: [], edges: [] });
    const isGraph = Array.isArray(stepsData.nodes) && Array.isArray(stepsData.edges);

    if (!isGraph) {
      throw new Error('Resuming old array-based workflows is not supported');
    }

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: { status: 'running' }
    });

    // Run graph logic starting from resumeStepId
    await this.traverseGraph(execution, execution.workflow, stepsData, context, execution.resumeStepId);
  }

  async traverseGraph(execution, workflow, graph, context, startNodeId) {
    const { nodes, edges } = graph;
    let currentNodeId = startNodeId;
    let executedCount = 0;
    const stepResults = context.steps || {};

    try {
      while (currentNodeId && executedCount < MAX_STEPS_PER_RUN) {
        const step = nodes.find(n => n.id === currentNodeId);
        if (!step) throw new Error(`Node ${currentNodeId} not found in graph`);

        const scope = this.buildScope(context, execution.id, workflow, stepResults);
        
        let stepOutcome;
        if (step.type === 'trigger') {
           // Skip execution logic for trigger, just move forward
           stepOutcome = { result: { triggered: true } };
        } else {
           stepOutcome = await this.executeStep(step, scope, workflow);
        }

        stepResults[step.id] = stepOutcome?.result ?? null;
        context.steps = stepResults;

        await this.logExecution(execution.id, 'info', `Step ${step.id} (${step.data?.actionType || step.type}) completed`);

        executedCount += 1;

        // Check for State Machine Pause
        if (stepOutcome?.pause) {
          // Find next step to resume from
          const nextEdges = edges.filter(e => e.source === step.id);
          const edge = stepOutcome.handleId 
             ? nextEdges.find(e => e.sourceHandle === stepOutcome.handleId)
             : nextEdges[0];
          
          const nextNodeId = edge ? edge.target : null;

          if (nextNodeId) {
            await prisma.workflowExecution.update({
              where: { id: execution.id },
              data: {
                status: 'paused',
                resumeStepId: nextNodeId,
                contextData: JSON.stringify(context)
              }
            });

            // Enqueue BullMQ if Wait
            if (stepOutcome.delayMs) {
               const { workflowQueue } = require('./workflowQueue');
               await workflowQueue.add({
                 executionId: execution.id,
                 stepId: nextNodeId
               }, { delay: stepOutcome.delayMs });
               await this.logExecution(execution.id, 'info', `Workflow paused for ${stepOutcome.delayMs}ms`);
            }

            // Ask Question Wait handled by webhookController
            if (stepOutcome.waitForReply) {
               const conversationId = context?.conversation?.id || context?.conversationId;
               if (conversationId) {
                  await prisma.conversation.update({
                    where: { id: conversationId },
                    data: {
                      waitingForWorkflowId: execution.id,
                      waitingForVariable: stepOutcome.saveToVariable || '{{contact.lastReply}}'
                    }
                  });
               }
               await this.logExecution(execution.id, 'info', `Workflow paused waiting for user reply`);
            }
          } else {
             // Reached end of workflow before pausing? Just complete it.
             await prisma.workflowExecution.update({
               where: { id: execution.id },
               data: { status: 'success', completedAt: new Date(), output: JSON.stringify(stepResults) }
             });
          }
          return; // Exit execution loop
        }

        // Determine next node
        if (stepOutcome?.jumpToNodeId) {
          currentNodeId = stepOutcome.jumpToNodeId;
          continue;
        }

        const nextEdges = edges.filter(e => e.source === step.id);
        if (nextEdges.length === 0) {
           currentNodeId = null; // End of workflow
           continue;
        }

        let nextEdge = null;
        if (step.data?.actionType === 'branch' && stepOutcome?.handleId) {
           nextEdge = nextEdges.find(e => e.sourceHandle === stepOutcome.handleId);
        } else {
           // Default to first edge if not a branch
           nextEdge = nextEdges[0];
        }

        currentNodeId = nextEdge ? nextEdge.target : null;
      }

      // Success
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          completedAt: new Date(),
          output: JSON.stringify(stepResults)
        }
      });

      return { executionId: execution.id, status: 'success', output: stepResults };

    } catch (error) {
      await this.logExecution(execution.id, 'error', error.message, { stack: error.stack });
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message,
          output: JSON.stringify(stepResults)
        }
      });
      return { executionId: execution.id, status: 'failed', error: error.message };
    }
  }

  async executeWorkflowRecord(workflow, context = {}, options = {}) {
    if (!workflow) throw new Error('Workflow is required');
    if (!workflow.isActive && !options.force) return { skipped: true, reason: 'inactive' };

    const stepsData = this.safeJsonParse(workflow.steps, { nodes: [], edges: [] });
    const isGraph = Array.isArray(stepsData.nodes) && Array.isArray(stepsData.edges);

    if (!isGraph) {
       // Fallback to legacy sequential engine
       return await this.__old_executeWorkflowRecord(workflow, context, options);
    }

    const { nodes } = stepsData;
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (!triggerNode) throw new Error(`Workflow "${workflow.name}" has no trigger node`);

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        conversationId: context?.conversation?.id || context?.conversationId || null,
        status: 'running',
        input: JSON.stringify({
          eventType: context?.eventType || null,
          triggerType: workflow.triggerType,
          contactNumber: context?.contact?.number || context?.conversation?.contactNumber || null,
        })
      }
    });

    return await this.traverseGraph(execution, workflow, stepsData, context, triggerNode.id);
  }

  async __old_executeWorkflowRecord(workflow, context = {}, options = {}) {
    if (!workflow) throw new Error('Workflow is required');
    if (!workflow.isActive && !options.force) {
      return { skipped: true, reason: 'inactive' };
    }

    const triggerConfig = this.safeJsonParse(workflow.triggerConfig, {});
    const steps = this.normalizeSteps(this.safeJsonParse(workflow.steps, []));
    if (!steps.length) {
      throw new Error(`Workflow "${workflow.name}" has no steps`);
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        conversationId: context?.conversation?.id || context?.conversationId || null,
        status: 'pending',
        input: JSON.stringify({
          eventType: context?.eventType || null,
          triggerType: workflow.triggerType,
          contactNumber: context?.contact?.number || context?.conversation?.contactNumber || null,
          message: context?.message?.content || context?.message?.text || null
        })
      }
    });

    const stepResults = {};
    const stepIndexById = new Map();
    steps.forEach((step, index) => stepIndexById.set(String(step.id), index));

    let pointer = triggerConfig?.startStepId ?? steps[0]?.id ?? 0;
    let executedCount = 0;

    try {
      while (pointer !== null && pointer !== undefined && executedCount < MAX_STEPS_PER_RUN) {
        const currentIndex = this.resolvePointerToIndex(pointer, steps, stepIndexById);
        if (currentIndex === null) {
          throw new Error(`Invalid workflow pointer "${pointer}"`);
        }

        const step = steps[currentIndex];
        const scope = this.buildScope(context, execution.id, workflow, stepResults);
        const stepOutcome = await this.executeStep(step, scope, workflow);

        stepResults[step.id] = stepOutcome?.result ?? null;
        await this.logExecution(execution.id, 'info', `Step ${step.id} (${step.type || step.action}) completed`, {
          stepId: step.id,
          stepType: step.type || step.action,
          result: stepOutcome?.result || null
        });

        executedCount += 1;
        if (stepOutcome?.stop) {
          pointer = null;
          continue;
        }

        const explicitNext = stepOutcome?.nextPointer ?? step.next ?? null;
        if (explicitNext !== null && explicitNext !== undefined && explicitNext !== '') {
          pointer = explicitNext;
          continue;
        }

        pointer = currentIndex + 1 < steps.length ? currentIndex + 1 : null;
      }

      if (executedCount >= MAX_STEPS_PER_RUN) {
        throw new Error(`Workflow exceeded max steps (${MAX_STEPS_PER_RUN})`);
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          completedAt: new Date(),
          output: JSON.stringify(stepResults)
        }
      });

      return {
        executionId: execution.id,
        status: 'success',
        output: stepResults
      };
    } catch (error) {
      await this.logExecution(execution.id, 'error', error.message, { stack: error.stack });
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message,
          output: JSON.stringify(stepResults)
        }
      });

      return {
        executionId: execution.id,
        status: 'failed',
        error: error.message
      };
    }
  }

  async executeWorkflow(workflowId, context = {}, options = {}) {
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow) {
      return { skipped: true, reason: 'not_found' };
    }
    return this.executeWorkflowRecord(workflow, context, options);
  }

  extractMessageText(context) {
    return String(
      context?.message?.content ||
      context?.message?.text ||
      context?.text ||
      ''
    );
  }

  matchesChannelFilters(triggerConfig, context) {
    const channels = Array.isArray(triggerConfig?.channelTypes) ? triggerConfig.channelTypes : [];
    if (channels.length) {
      const currentChannel = String(context?.instance?.channelType || context?.conversation?.channelType || '').toLowerCase();
      if (!channels.map((item) => String(item).toLowerCase()).includes(currentChannel)) return false;
    }

    const instanceIds = Array.isArray(triggerConfig?.instanceIds) ? triggerConfig.instanceIds : [];
    if (instanceIds.length) {
      const currentInstanceId = String(context?.instance?.id || context?.instanceId || '');
      if (!instanceIds.map((item) => String(item)).includes(currentInstanceId)) return false;
    }

    return true;
  }

  async isFirstInboundMessage(workflow, context) {
    if (typeof context?.isFirstMessage === 'boolean') return context.isFirstMessage;
    const conversationId = context?.conversation?.id || context?.conversationId;
    if (!conversationId) return false;

    const count = await prisma.chatMessage.count({
      where: {
        conversationId,
        direction: 'incoming'
      }
    });
    return count <= 1;
  }

  async shouldTriggerWorkflow(workflow, eventType, context) {
    const triggerConfig = this.safeJsonParse(workflow.triggerConfig, {});
    if (!this.matchesChannelFilters(triggerConfig, context)) return false;

    if (triggerConfig?.runOncePerConversation) {
      const conversationId = context?.conversation?.id || context?.conversationId;
      if (conversationId) {
        const existing = await prisma.workflowExecution.findFirst({
          where: {
            workflowId: workflow.id,
            conversationId,
            status: 'success'
          },
          select: { id: true }
        });
        if (existing) return false;
      }
    }

    const triggerType = String(workflow.triggerType || '').toLowerCase();
    const incomingText = this.extractMessageText(context).toLowerCase();

    if (triggerType === 'manual') {
      return eventType === 'manual' || eventType === 'test';
    }

    if (triggerType === 'agent_action') {
      return eventType === 'agent_action';
    }

    if (triggerType === 'inbound_message') {
      return eventType === 'inbound_message';
    }

    if (triggerType === 'welcome') {
      if (eventType !== 'inbound_message') return false;
      return this.isFirstInboundMessage(workflow, context);
    }

    if (triggerType === 'keyword') {
      if (eventType !== 'inbound_message') return false;

      const configuredKeywords = Array.isArray(triggerConfig?.keywords)
        ? triggerConfig.keywords
        : [triggerConfig?.keyword || triggerConfig?.triggerValue].filter(Boolean);
      const keywords = configuredKeywords
        .map((keyword) => String(keyword || '').trim().toLowerCase())
        .filter(Boolean);
      if (!keywords.length) return false;

      const matchMode = String(triggerConfig?.match || 'any').toLowerCase();
      if (matchMode === 'all') {
        return keywords.every((keyword) => incomingText.includes(keyword));
      }
      return keywords.some((keyword) => incomingText.includes(keyword));
    }

    return triggerType === String(eventType || '').toLowerCase();
  }

  async executeTriggeredWorkflows(eventType, context = {}) {
    const tenantId = context?.tenantId || context?.instance?.tenantId || context?.conversation?.tenantId;
    if (!tenantId) return { matched: false, count: 0, executions: [] };

    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const executions = [];
    for (const workflow of workflows) {
      const shouldRun = await this.shouldTriggerWorkflow(workflow, eventType, context);
      if (!shouldRun) continue;

      const result = await this.executeWorkflowRecord(
        workflow,
        { ...context, tenantId, eventType },
        { force: true }
      );
      executions.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        ...result
      });
    }

    return {
      matched: executions.length > 0,
      count: executions.length,
      executions
    };
  }

  getTemplates() {
    return [
      {
        id: 'lead_capture_inbound',
        name: 'Lead Capture and Tag',
        description: 'On inbound messages, tag the contact and push lead data to a Google Sheet.',
        triggerType: 'inbound_message',
        triggerConfig: { runOncePerConversation: false },
        steps: [
          { id: 'tag_lead', type: 'add_tag', params: { tag: 'new-lead' } },
          {
            id: 'save_sheet',
            type: 'integration_action',
            params: {
              integrationId: '{{workflow.defaultIntegrationId}}',
              action: 'append_row',
              spreadsheetId: '{{workflow.defaultSpreadsheetId}}',
              values: [
                '{{now}}',
                '{{contact.number}}',
                '{{conversation.contactName}}',
                '{{message.content}}'
              ]
            }
          },
          { id: 'end', type: 'end' }
        ]
      },
      {
        id: 'keyword_sales_route',
        name: 'Keyword Sales Router',
        description: 'If message contains sales intent, tag as SQL and move lifecycle stage.',
        triggerType: 'keyword',
        triggerConfig: { keywords: ['price', 'quote', 'demo', 'buy'], match: 'any' },
        steps: [
          { id: 'add_sql_tag', type: 'add_tag', params: { tag: 'sql' } },
          { id: 'stage', type: 'set_lifecycle_stage', params: { stageName: 'Qualified' } },
          { id: 'end', type: 'end' }
        ]
      },
      {
        id: 'after_hours_reply',
        name: 'After Hours Auto Reply',
        description: 'Send a message when a contact writes outside working hours.',
        triggerType: 'inbound_message',
        triggerConfig: {},
        steps: [
          {
            id: 'is_after_hours',
            type: 'condition',
            logic: 'or',
            conditions: [
              { left: '{{message.hour}}', operator: 'lt', right: 9 },
              { left: '{{message.hour}}', operator: 'gte', right: 22 }
            ],
            ifTrue: 'reply_after_hours',
            ifFalse: 'end'
          },
          {
            id: 'reply_after_hours',
            type: 'send_message',
            text: 'Thanks for reaching out. Our team is currently offline and will get back to you during working hours.'
          },
          { id: 'end', type: 'end' }
        ]
      }
    ];
  }
}

module.exports = new WorkflowService();

