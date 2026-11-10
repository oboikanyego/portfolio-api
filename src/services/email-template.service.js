const Handlebars = require('handlebars');
const EmailTemplate = require('../models/email-template.model');
const { seedEmailTemplates } = require('../config/email-template-seeds');
const VALID_KEYS = new Set(['contact', 'cv-request']);
const handlebars = Handlebars.create();

// Values are escaped by default for HTML output. Subject output is plaintext.
const MAX_HTML = 60000;
function validateTemplateSource(source, allowedVariables, { subject = false } = {}) {
  if (typeof source !== 'string' || !source.trim() || source.length > (subject ? 3000 : MAX_HTML)) {
    throw new Error(subject ? 'Subject must be 1–3000 characters.' : 'HTML must be 1–60000 characters.');
  }
  if (/\{\{\{|\}\}\}/.test(source)) throw new Error('Unescaped triple-brace variables are not allowed.');
  if (!subject && /<\s*script\b|<\s*iframe\b|\bon\w+\s*=|javascript\s*:/i.test(source)) {
    throw new Error('Executable HTML content is not allowed in notification templates.');
  }
  try {
    const ast = handlebars.parse(source);
    const allowed = new Set(allowedVariables);
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'MustacheStatement') {
        if (node.path.type !== 'PathExpression' || !allowed.has(node.path.original) || node.params?.length ||
            node.hash?.pairs?.length || node.escaped !== true) {
          throw new Error('Use only escaped variables: ' + Array.from(allowed).map(v=>'{{'+v+'}}').join(', '));
        }
      }
      if (node.type === 'BlockStatement') {
        const helper = node.path?.original;
        if (!['if','unless'].includes(helper) || node.params.length !== 1 ||
            !allowed.has(node.params[0].original) || node.hash?.pairs?.length) {
          throw new Error('Only {{#if variable}} / {{#unless variable}} blocks are allowed.');
        }
      }
      if (['PartialStatement','PartialBlockStatement','SubExpression','Decorator','DecoratorBlock'].includes(node.type)) {
        throw new Error('Partial and expression helpers are not supported.');
      }
      if (Array.isArray(node)) node.forEach(visit);
      else for (const [field,value] of Object.entries(node)) {
        if (field === 'loc' || field === 'path' || field === 'params' || field === 'hash') continue;
        if (value && typeof value === 'object') visit(value);
      }
    };
    visit(ast);
    return true;
  } catch (error) {
    throw new Error('Invalid Handlebars template: ' + error.message);
  }
}
function validateFields(key, subjectTemplate, htmlTemplate) {
  const seed = seedEmailTemplates.find(item=>item.key===key);
  if (!seed || !VALID_KEYS.has(key)) throw new Error('Unknown email template.');
  validateTemplateSource(subjectTemplate, seed.allowedVariables, { subject: true });
  validateTemplateSource(htmlTemplate, seed.allowedVariables);
}
function renderTemplate(template, values) {
  validateFields(template.key, template.subjectTemplate, template.htmlTemplate);
  const data = Object.fromEntries((template.allowedVariables || []).map(field => {
    const value = values?.[field];
    return [field, value == null ? '' : String(value)];
  }));
  // Allowlist data is known from migration defaults, not a client request.
  return {
    subject: handlebars.compile(template.subjectTemplate, { noEscape: true })(data).replace(/[\r\n]+/g,' ').trim(),
    html: handlebars.compile(template.htmlTemplate)(data)
  };
}
async function ensureEmailTemplates() {
  for (const seed of seedEmailTemplates) {
    validateFields(seed.key, seed.subjectTemplate, seed.htmlTemplate);
    await EmailTemplate.updateOne(
      { key: seed.key }, { $setOnInsert: seed }, { upsert: true, runValidators: true }
    );
  }
  const count = await EmailTemplate.countDocuments({ key: { $in: Array.from(VALID_KEYS) } });
  if (count !== VALID_KEYS.size) throw new Error('Unable to seed required email templates.');
  return count;
}
async function renderStoredTemplate(key, values) {
  if (!VALID_KEYS.has(key)) throw new Error('Unknown email template.');
  const template = await EmailTemplate.findOne({ key }).lean();
  // Intentionally no filesystem fallback: MongoDB is authoritative after migration.
  if (!template) throw new Error('Email template ' + key + ' is missing in MongoDB.');
  return renderTemplate(template, values);
}
const previewValues = Object.freeze({
  fullName: 'Example Client',
  email: 'example@example.com',
  company: 'Example Company',
  subject: 'A new Angular project',
  budget: 'To be discussed',
  message: 'Hello, I would like to discuss a custom web application.',
  reason: 'Recruiting for an Angular and Node.js engineering role.',
  source: 'contact_page'
});
module.exports = { validateFields, validateTemplateSource, renderTemplate,
  renderStoredTemplate, ensureEmailTemplates, previewValues, VALID_KEYS };
