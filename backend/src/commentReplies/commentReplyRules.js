const ALLOWED_TEMPLATE_VARIABLES = new Set([
  'customer_name',
  'page_name',
  'post_name',
  'platform'
]);

const ARABIC_MARKS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/giu;
const MATCHING_TOKENS = /[\p{L}\p{N}]+/gu;
const CURSOR_FIELDS = {
  facebook: 'facebookRotationCursor',
  instagram: 'instagramRotationCursor'
};

function normalizeCommentText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .replace(ARABIC_MARKS, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
}

function dateSortValue(value) {
  if (value == null) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compareRules(left, right) {
  const priorityDifference = Number(left.priority || 0) - Number(right.priority || 0);
  if (priorityDifference !== 0) return priorityDifference;

  const createdAtDifference = dateSortValue(left.createdAt) - dateSortValue(right.createdAt);
  if (createdAtDifference !== 0) return createdAtDifference;

  return String(left.id || '').localeCompare(String(right.id || ''));
}

function compareVariants(left, right) {
  const orderDifference = Number(left.orderIndex || 0) - Number(right.orderIndex || 0);
  if (orderDifference !== 0) return orderDifference;

  const createdAtDifference = dateSortValue(left.createdAt) - dateSortValue(right.createdAt);
  if (createdAtDifference !== 0) return createdAtDifference;

  return String(left.id || '').localeCompare(String(right.id || ''));
}

function matchingTokens(text) {
  return normalizeCommentText(text).match(MATCHING_TOKENS) || [];
}

function containsTokenSequence(textTokens, keywordTokens) {
  if (keywordTokens.length === 0 || keywordTokens.length > textTokens.length) return false;

  for (let index = 0; index <= textTokens.length - keywordTokens.length; index += 1) {
    if (keywordTokens.every((token, offset) => textTokens[index + offset] === token)) return true;
  }

  return false;
}

function matchesRule(text, rule) {
  const normalizedText = matchingTokens(text);
  const keywords = Array.isArray(rule.keywords)
    ? rule.keywords.map(matchingTokens).filter((keyword) => keyword.length > 0)
    : [];
  if (keywords.length === 0) return false;

  switch (String(rule.matchMode || '').toLowerCase()) {
    case 'contains_any':
      return keywords.some((keyword) => containsTokenSequence(normalizedText, keyword));
    case 'contains_all':
      return keywords.every((keyword) => containsTokenSequence(normalizedText, keyword));
    case 'exact':
      return keywords.some((keyword) => normalizedText.length === keyword.length
        && normalizedText.every((token, index) => token === keyword[index]));
    default:
      return false;
  }
}

function matchCommentRule({ text, rules } = {}) {
  if (!Array.isArray(rules)) return null;

  const eligibleRules = rules
    .filter((rule) => rule?.isEnabled === true && !rule.deletedAt)
    .slice()
    .sort(compareRules);

  return eligibleRules.find((rule) => matchesRule(text, rule)) || null;
}

function getVariantPool({ variants, platform } = {}) {
  const eligibleVariants = Array.isArray(variants)
    ? variants.filter((variant) => variant?.isEnabled === true && !variant.deletedAt)
    : [];
  const platformVariants = eligibleVariants.filter((variant) => variant.platform === platform);
  const sharedVariants = eligibleVariants.filter((variant) => variant.platform == null);
  const usesPlatformVariants = platformVariants.length > 0;
  const pool = (usesPlatformVariants ? platformVariants : sharedVariants).slice().sort(compareVariants);
  const cursorField = usesPlatformVariants
    ? (CURSOR_FIELDS[platform] || 'sharedRotationCursor')
    : 'sharedRotationCursor';

  return { pool, cursorField };
}

function renderCommentTemplate(template, variables = {}) {
  return String(template ?? '').replace(/\{\{([\s\S]*?)\}\}/gu, (placeholder, rawName) => {
    const name = rawName.trim();
    if (!ALLOWED_TEMPLATE_VARIABLES.has(name)) {
      throw new Error(`UNKNOWN_TEMPLATE_VARIABLE: ${name}`);
    }
    return variables[name] == null ? '' : String(variables[name]);
  });
}

module.exports = {
  getVariantPool,
  matchCommentRule,
  normalizeCommentText,
  renderCommentTemplate
};
