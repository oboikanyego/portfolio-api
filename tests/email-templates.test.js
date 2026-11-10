const test = require('node:test');
const assert = require('node:assert/strict');
const EmailTemplate = require('../src/models/email-template.model');
const { seedEmailTemplates } = require('../src/config/email-template-seeds');
const { validateFields, renderTemplate, renderStoredTemplate, ensureEmailTemplates } =
  require('../src/services/email-template.service');
const app = require('../src/app');

test('both Resend notifications render Handlebars variables from stored template data', () => {
  for(const template of seedEmailTemplates) {
    const result=renderTemplate(template, {
      fullName: 'A & B <script>alert(1)</script>',
      email: 'person@example.com', company: 'Acme & Co',
      subject: 'Research & development', message: '<img src=x onerror=alert(1)>',
      reason: 'For an Angular engineering role'
    });
    assert.ok(result.subject.length > 0);
    assert.ok(result.html.includes('A &amp; B &lt;script&gt;'),template.key);
    assert.ok(!result.html.includes('<script>alert(1)</script>'));
    assert.doesNotMatch(result.html,/<img src=x onerror=alert\(1\)>/);
  }
});

test('template validation rejects unsafe interpolation, unknown fields and executable HTML',()=>{
  assert.throws(()=>validateFields('contact','{{notReal}}','<p>Hello</p>'),/Invalid Handlebars/);
  assert.throws(()=>validateFields('contact','Subject','<p>{{{message}}}</p>'),/triple-brace/);
  assert.throws(()=>validateFields('contact','Subject','<script>bad()</script>'),/Executable HTML/);
  assert.throws(()=>validateFields('cv-request','{{message}}','<p>Hi</p>'),/Invalid Handlebars/);
  const doc={...seedEmailTemplates[0],subjectTemplate:'Message: {{subject}}',
    htmlTemplate:'<p>{{#if company}}{{company}}{{else}}Independent{{/if}}</p>'};
  assert.match(renderTemplate(doc,{company:'Acme & Co',subject:'hi'}).html,/Acme &amp; Co/);
});

test('DB migration inserts only missing templates and preserves existing admin versions',async()=>{
  const originals={updateOne:EmailTemplate.updateOne,countDocuments:EmailTemplate.countDocuments};
  let calls=0;
  try{
    EmailTemplate.updateOne=async(query,update,opts)=>{
      calls++;
      assert.equal(opts.upsert,true);
      assert.ok(update.$setOnInsert?.htmlTemplate);
      assert.ok(!update.$set);
    };
    EmailTemplate.countDocuments=async()=>2;
    assert.equal(await ensureEmailTemplates(),2);
    assert.equal(calls,2);
  } finally { Object.assign(EmailTemplate,originals); }
});

test('sending service fails clearly rather than using removed filesystem templates',async()=>{
  const prior=EmailTemplate.findOne;
  try {
    EmailTemplate.findOne=()=>({lean:async()=>null});
    await assert.rejects(renderStoredTemplate('contact',{fullName:'test'}),/missing in MongoDB/);
    EmailTemplate.findOne=()=>({lean:async()=>structuredClone(seedEmailTemplates[0])});
    const output=await renderStoredTemplate('contact',{fullName:'Example',email:'x@example.com',
      subject:'Hello',message:'Welcome'});
    assert.match(output.subject,/Portfolio Contact: Hello/);
    assert.match(output.html,/Example/);
  } finally { EmailTemplate.findOne=prior; }
});

test('admin email template routes require authentication, including preview and updates',async()=>{
  const server=app.listen(0,'127.0.0.1');
  try{
    await new Promise(resolve=>server.once('listening',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    for (const endpoint of ['/api/admin/email-templates',
      '/api/admin/email-templates/contact/preview','/api/admin/email-templates/contact']) {
      const method=endpoint.endsWith('/preview')?'POST':endpoint.endsWith('/contact')?'PUT':'GET';
      const r=await fetch(base+endpoint,{method,headers:{'content-type':'application/json'},body:method==='GET'?undefined:'{}'});
      assert.equal(r.status,401,endpoint);
    }
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
