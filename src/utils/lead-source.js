const ALLOWED_SOURCES = new Set(['hire_me','discuss_project','request_cv','contact_page','project_case_study','homepage','projects_page','other']);
function cleanLeadSource(value, fallback) {
  return typeof value === 'string' && ALLOWED_SOURCES.has(value) ? value : fallback;
}
module.exports = { cleanLeadSource, ALLOWED_SOURCES };
