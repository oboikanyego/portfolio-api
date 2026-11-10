const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanLeadSource } = require('../src/utils/lead-source');
const InteractionEvent = require('../src/models/interaction-event.model');
const ContactMessage = require('../src/models/contact-message.model');
const CvRequest = require('../src/models/cv-request.model');
test('lead sources are strictly allowlisted and do not accept arbitrary request values',()=>{
  assert.equal(cleanLeadSource('hire_me','contact_page'),'hire_me');
  assert.equal(cleanLeadSource('javascript:evil','contact_page'),'contact_page');
  assert.equal(cleanLeadSource({unexpected:true},'request_cv'),'request_cv');
});
test('tracking schemas support real project views and CTA clicks',()=>{
  const names=InteractionEvent.schema.path('name').enumValues;
  for(const type of ['project_view','project_live','hire_me_click','discuss_project_click','request_cv_click']) {
    assert.ok(names.includes(type),type);
  }
  assert.equal(new ContactMessage({}).source,'contact_page');
  assert.equal(new CvRequest({}).source,'request_cv');
});
