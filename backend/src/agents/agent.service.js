const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const deepseekService = require('../ai/deepseek.service');

class AgentService {
  /**
   * Process incoming message with AI Agent
   */
  async processMessage({ conversationId, message, contactNumber, tenantId }) {
    try {
      // 1. Get conversation with current agent
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          currentAgent: {
            include: {
              knowledgeSources: {
                where: { isActive: true }
              },
              actions: {
                where: { isEnabled: true }
              }
            }
          }
        }
      });

      // 2. If no agent assigned, assign default
      let agent = conversation?.currentAgent;
      
      if (!agent) {
        agent = await this.assignDefaultAgent(conversationId, tenantId);
      }

      if (!agent || !agent.isActive) {
        return null; // No AI agent available
      }

      // 3. Check working hours
      if (!this.isWithinWorkingHours(agent)) {
        return {
          response: agent.outOfHoursMessage || 'We are currently offline. Please try again during business hours.',
          agent: agent
        };
      }

      // 4. Get conversation history
      const history = await this.getConversationHistory(conversationId, agent.historyLength);

      // 5. Build context with knowledge base (RAG)
      const context = await this.buildContext(message, agent.knowledgeSources, agent.id);

      // 6. Generate AI response
      const aiResponse = await deepseekService.chat({
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(agent, context)
          },
          ...history,
          {
            role: 'user',
            content: message
          }
        ],
        temperature: agent.temperature,
        max_tokens: agent.maxTokens
      });

      // 7. Check for routing triggers
      await this.checkRoutingRules(conversation, agent, message, aiResponse);

      // 8. Execute agent actions
      await this.executeActions(agent, conversation, message, aiResponse);

      // 9. Update conversation tracking
      await this.updateConversationTracking(conversationId, agent.id);

      return {
        response: aiResponse,
        agent: agent
      };

    } catch (error) {
      console.error('[AgentService] Error processing message:', error);
      
      // Increment failed attempts
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          failedAttempts: { increment: 1 },
          escalated: true,
          escalationReason: 'AI processing failed'
        }
      });

      return null;
    }
  }

  /**
   * Assign default agent to conversation
   */
  async assignDefaultAgent(conversationId, tenantId) {
    const defaultAgent = await prisma.aIAgent.findFirst({
      where: {
        tenantId: tenantId,
        isActive: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        knowledgeSources: { where: { isActive: true } },
        actions: { where: { isEnabled: true } }
      }
    });

    if (!defaultAgent) {
    console.warn('[AgentService] No active default agent found for tenant:', tenantId);
    return null;
  }

    // Assign agent to conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { currentAgentId: defaultAgent.id }
    });

    // Track agent assignment
    await prisma.conversationAgent.create({
      data: {
        conversationId: conversationId,
        agentId: defaultAgent.id,
        startedAt: new Date()
      }
    });

    return defaultAgent;
  }

  /**
   * Build system prompt
   */
  buildSystemPrompt(agent, context) {
    let prompt = agent.instructions;

    // Add tone and style
    prompt += `\n\nTone: ${agent.tone}`;
    prompt += `\nResponse Style: ${agent.responseStyle}`;

    // Add knowledge base context
    if (context && context.length > 0) {
      prompt += `\n\nKnowledge Base:\n${context.join('\n\n')}`;
    }

    // Add greeting if first message
    if (agent.greeting) {
      prompt += `\n\nGreeting (use this for first interaction): ${agent.greeting}`;
    }

    return prompt;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId, limit = 10) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    // Convert to AI format
    return messages.reverse().map(msg => ({
      role: msg.direction === 'outgoing' ? 'assistant' : 'user',
      content: msg.content || ''
    }));
  }

  /**
   * Build context from knowledge base using vector similarity search (RAG)
   * Falls back to keyword matching if vector search fails
   */
  async buildContext(message, knowledgeSources, agentId) {
    // Try vector search first (RAG)
    if (agentId) {
      try {
        const knowledgeService = require('../services/knowledgeService');
        const results = await knowledgeService.searchKnowledge(message, agentId, 5);
        if (results.length > 0) {
          console.log(`[AgentService] RAG: Found ${results.length} relevant knowledge chunks`);
          return results.map(r => `${r.title}: ${r.content}`);
        }
      } catch (error) {
        console.warn('[AgentService] Vector search failed, falling back to keyword matching:', error.message);
      }
    }

    // Fallback: keyword matching on pre-loaded knowledge sources
    if (!knowledgeSources || knowledgeSources.length === 0) return [];

    const keywords = message.toLowerCase().split(' ').filter(w => w.length > 3);
    
    const relevantKnowledge = knowledgeSources.filter(kb => {
      const content = (kb.title + ' ' + kb.content).toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    });

    return relevantKnowledge.map(kb => `${kb.title}: ${kb.content}`);
  }

  /**
   * Check if within working hours
   */
  isWithinWorkingHours(agent) {
    if (!agent.workingHoursEnabled || !agent.workingHours) return true;

    const now = new Date();
    const currentDay = now.toLocaleLowerCase('en-US', { weekday: 'long' }); // e.g., "monday"
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const schedule = agent.workingHours[currentDay];
    if (!schedule || !schedule.enabled) return false;

    const [startHour, startMin] = schedule.start.split(':').map(Number);
    const [endHour, endMin] = schedule.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Check routing rules
   */
  async checkRoutingRules(conversation, agent, message, aiResponse) {
    const rules = await prisma.agentRoutingRule.findMany({
      where: {
        fromAgentId: agent.id,
        isActive: true
      },
      orderBy: { priority: 'desc' }
    });

    for (const rule of rules) {
      let shouldRoute = false;

      if (rule.triggerType === 'keywords') {
        const messageText = message.toLowerCase();
        // Check if any keyword matches
        shouldRoute = rule.keywords.some(kw => messageText.includes(kw.toLowerCase()));
      }

      if (rule.triggerType === 'failed_attempts') {
        shouldRoute = conversation.failedAttempts >= (rule.failedAttempts || 3);
      }

      if (shouldRoute) {
        await this.routeConversation(conversation.id, agent.id, rule);
        break; // Stop after first matching rule
      }
    }
  }

  /**
   * Route conversation to another agent/team
   */
  async routeConversation(conversationId, fromAgentId, rule) {
    // End current agent session
    await prisma.conversationAgent.updateMany({
      where: {
        conversationId: conversationId,
        agentId: fromAgentId,
        endedAt: null
      },
      data: {
        endedAt: new Date(),
        handoffReason: rule.triggerType
      }
    });

    // Assign new agent
    if (rule.toAgentId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { currentAgentId: rule.toAgentId }
      });

      await prisma.conversationAgent.create({
        data: {
          conversationId: conversationId,
          agentId: rule.toAgentId,
          startedAt: new Date()
        }
      });
    } else {
      // Escalate to human
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          currentAgentId: null,
          escalated: true,
          escalatedAt: new Date(),
          escalationReason: rule.triggerType
        }
      });
    }
  }

  /**
   * Execute agent actions
   */
  async executeActions(agent, conversation, message, aiResponse) {
    // Implement action execution logic
    // This will be expanded in later phases
  }

  /**
   * Update conversation tracking
   */
  async updateConversationTracking(conversationId, agentId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastBotResponseAt: new Date()
      }
    });

    // Increment message count for current agent session
    const activeSession = await prisma.conversationAgent.findFirst({
      where: {
        conversationId: conversationId,
        agentId: agentId,
        endedAt: null
      }
    });

    if (activeSession) {
      await prisma.conversationAgent.update({
        where: { id: activeSession.id },
        data: { messagesCount: { increment: 1 } }
      });
    }
  }
}

module.exports = new AgentService();
