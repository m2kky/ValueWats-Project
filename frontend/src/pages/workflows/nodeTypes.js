// Workflow Node type definitions and metadata
// This is the single source of truth for all node types in the builder.

import {
  BoltIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  TagIcon,
  IdentificationIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  TableCellsIcon,
  CpuChipIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon,
  PlayIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

// ─── Trigger Types ───────────────────────────────────────────
export const TRIGGER_TYPES = [
  { value: 'conversation_opened', label: 'Conversation Opened', description: 'When a new conversation starts', icon: ChatBubbleLeftRightIcon },
  { value: 'conversation_closed', label: 'Conversation Closed', description: 'When a conversation ends', icon: CheckCircleIcon },
  { value: 'tag_updated', label: 'Contact Tag Updated', description: 'When a tag is added or removed', icon: TagIcon },
  { value: 'field_updated', label: 'Contact Field Updated', description: 'When a contact field changes', icon: IdentificationIcon },
  { value: 'lifecycle_updated', label: 'Lifecycle Updated', description: 'When a lifecycle stage changes', icon: ArrowPathIcon },
  { value: 'manual', label: 'Manual / Shortcut', description: 'Triggered manually from inbox', icon: PlayIcon },
  { value: 'webhook', label: 'Incoming Webhook', description: 'Triggered by external HTTP call', icon: GlobeAltIcon },
  { value: 'agent_action', label: 'AI Agent Action', description: 'Triggered by an AI Agent', icon: CpuChipIcon },
];

// ─── Action Step Types ───────────────────────────────────────
export const ACTION_TYPES = [
  // Messaging
  { value: 'send_message', label: 'Send a Message', description: 'Send text, image, or file', icon: ChatBubbleLeftRightIcon, color: '#6366f1', category: 'messaging' },
  { value: 'ask_question', label: 'Ask a Question', description: 'Ask and save the reply', icon: QuestionMarkCircleIcon, color: '#8b5cf6', category: 'messaging' },

  // Routing & Logic
  { value: 'branch', label: 'Branch', description: 'If/Else conditional router', icon: ArrowsRightLeftIcon, color: '#f59e0b', category: 'logic' },
  { value: 'wait', label: 'Wait / Delay', description: 'Pause for a duration', icon: ClockIcon, color: '#64748b', category: 'logic' },
  { value: 'jump_to', label: 'Jump To', description: 'Jump to a previous step', icon: ArrowUturnLeftIcon, color: '#64748b', category: 'logic' },
  { value: 'trigger_workflow', label: 'Trigger Workflow', description: 'Run another workflow', icon: BoltIcon, color: '#64748b', category: 'logic' },

  // CRM
  { value: 'assign_to', label: 'Assign To', description: 'Assign to user or team', icon: UserGroupIcon, color: '#10b981', category: 'crm' },
  { value: 'update_field', label: 'Update Contact Field', description: 'Modify contact data', icon: IdentificationIcon, color: '#10b981', category: 'crm' },
  { value: 'update_tag', label: 'Update Contact Tag', description: 'Add or remove tags', icon: TagIcon, color: '#10b981', category: 'crm' },
  { value: 'update_lifecycle', label: 'Update Lifecycle', description: 'Change sales stage', icon: ArrowPathIcon, color: '#10b981', category: 'crm' },
  { value: 'open_conversation', label: 'Open Conversation', description: 'Open a conversation', icon: PlusCircleIcon, color: '#10b981', category: 'crm' },
  { value: 'close_conversation', label: 'Close Conversation', description: 'Close with notes', icon: CheckCircleIcon, color: '#10b981', category: 'crm' },
  { value: 'add_comment', label: 'Add Comment', description: 'Internal agent note', icon: ChatBubbleBottomCenterTextIcon, color: '#10b981', category: 'crm' },

  // Integrations
  { value: 'http_request', label: 'HTTP Request', description: 'Call an external API', icon: GlobeAltIcon, color: '#ec4899', category: 'integration' },
  { value: 'google_sheets', label: 'Google Sheets', description: 'Add or update a row', icon: TableCellsIcon, color: '#ec4899', category: 'integration' },
  { value: 'ai_agent', label: 'AI Agent', description: 'Hand off to AI Agent', icon: CpuChipIcon, color: '#ec4899', category: 'integration' },
];

// Category labels for the sidebar grouping
export const CATEGORIES = {
  messaging: { label: 'Messaging', color: '#6366f1' },
  logic: { label: 'Logic & Flow', color: '#f59e0b' },
  crm: { label: 'CRM Actions', color: '#10b981' },
  integration: { label: 'Integrations', color: '#ec4899' },
};

// Helper to get type metadata
export function getActionMeta(type) {
  return ACTION_TYPES.find(a => a.value === type) || { label: type, icon: BoltIcon, color: '#64748b' };
}

export function getTriggerMeta(type) {
  return TRIGGER_TYPES.find(t => t.value === type) || { label: type, icon: BoltIcon };
}
