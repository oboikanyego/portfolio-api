const test=require('node:test');
const assert=require('node:assert/strict');
const defaults=require('../src/config/default-site-config');
const { migratePortfolioCms }=require('../src/config/portfolio-cms-migration');
const { enhanceShowcase }=require('../src/config/showcase-audit');
const { completeVerifiedShowcase }=require('../src/config/showcase-v8');

const before=()=>enhanceShowcase(migratePortfolioCms(defaults,defaults));
const get=(config,name)=>config.projects.find(x=>x.name===name);

test('verified v8 migration completes EatHealthy only from documented prototype features',()=>{
  const v7=before(); const v8=completeVerifiedShowcase(v7);
  assert.equal(v8.projects.length,11);
  const eat=get(v8,'EatHealthy');
  for(const field of ['summary','role','challenge','outcome']) assert.ok(eat.caseStudy[field]);
  for(const field of ['architecture','approach','challenges']) assert.ok(eat.caseStudy[field].length>=3);
  assert.match(eat.caseStudy.outcome,/prototype/i);
  assert.match(eat.caseStudy.outcome,/future work/i);
  assert.equal(eat.image,get(v7,'EatHealthy').image);
});
test('v8 marks chat as a genuine incomplete foundation and links only verified source',()=>{
  const result=completeVerifiedShowcase(before());
  const chat=get(result,'Real-Time Chat System');
  assert.equal(chat.liveUrl,'');
  assert.equal(chat.githubUrl,'https://github.com/oboikanyego/real-time-chat-system');
  assert.match(chat.caseStudy.outcome,/not completed|planned milestones/i);
  assert.match(chat.description,/foundation/i);
});
test('v8 traces auth patterns to real FreelancerHub source, never a fake deployed app',()=>{
  const result=completeVerifiedShowcase(before());
  const auth=get(result,'Secure Authentication System');
  assert.equal(auth.liveUrl,'');
  assert.ok(auth.githubUrl.endsWith('Freelance-Services-Platform_server'));
  assert.doesNotMatch(auth.description,/email verification/i);
  assert.match(auth.caseStudy.outcome,/not an independent live app/i);
});
test('v8 updates seeded risk architecture to documented MongoDB and Kraken implementation',()=>{
  const result=completeVerifiedShowcase(before());
  const risk=get(result,'Real-Time Portfolio Risk Dashboard');
  assert.equal(risk.liveUrl,'https://portfolio-risk-monitor.netlify.app/');
  assert.equal(risk.githubUrl,'https://github.com/oboikanyego/portfolio-risk-ui');
  assert.ok(risk.caseStudy.architecture.some(x=>x.label==='Market feed' && /Kraken/.test(x.value)));
  assert.match(risk.stack,/MongoDB/);
});
test('migration is idempotent and does not overwrite admin-authored fields',()=>{
  const config=before();
  for(const slug of ['eathealthy','real-time-chat-system','secure-authentication-system','real-time-portfolio-risk-dashboard']){
    const entry=config.projects.find(x=>x.slug===slug);
    entry.description='Admin wrote this description';
    entry.caseStudy={...entry.caseStudy,summary:'Admin-written summary',architecture:[{label:'Admin',value:'Custom'}]};
    entry.githubUrl='https://github.com/oboikanyego/custom';
  }
  const result=completeVerifiedShowcase(config);
  for(const slug of ['eathealthy','real-time-chat-system','secure-authentication-system','real-time-portfolio-risk-dashboard']){
    const entry=result.projects.find(x=>x.slug===slug);
    assert.equal(entry.description,'Admin wrote this description');
    assert.equal(entry.caseStudy.summary,'Admin-written summary');
    assert.deepEqual(entry.caseStudy.architecture,[{label:'Admin',value:'Custom'}]);
    assert.equal(entry.githubUrl,'https://github.com/oboikanyego/custom');
  }
  assert.deepEqual(completeVerifiedShowcase(result),result);
});
