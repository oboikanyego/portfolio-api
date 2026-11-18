const test=require('node:test');
const assert=require('node:assert/strict');
const defaults=require('../src/config/default-site-config');
const { migratePortfolioCms }=require('../src/config/portfolio-cms-migration');
const { enhanceShowcase }=require('../src/config/showcase-audit');
const { completeVerifiedShowcase }=require('../src/config/showcase-v8');

const before=()=>{
  const next=enhanceShowcase(migratePortfolioCms(defaults,defaults));
  // EatHealthy is a MongoDB-authored project added after the repository defaults.
  next.projects.push({
    name:'EatHealthy',slug:'eathealthy',
    stack:'Angular · Node.js · Express · TypeScript · MongoDB',
    description:'Budget-aware meal planning prototype for South African routines.',
    liveUrl:'https://mzansiwell.netlify.app/',
    githubUrl:'https://github.com/oboikanyego/mzansiwell',
    image:'https://res.cloudinary.com/dv2hhefed/image/upload/v1794286663/bk-portfolio/projects/eathealthy-desktop.webp',
    mobileImage:'',published:true,featured:false,caseStudy:{}
  });
  return next;
};
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
  assert.ok(!risk.githubUrl, 'private repository URL must not be added');
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


test('v8 supplies authentic Cloudinary desktop/mobile evidence without claiming source-only projects are deployed',()=>{
  const result=completeVerifiedShowcase(before());
  for(const name of ['Real-Time Portfolio Risk Dashboard','Real-Time Chat System','Secure Authentication System']){
    const p=get(result,name);
    assert.match(p.image,/^https:\/\/res\.cloudinary\.com\/dv2hhefed\/image\/upload\/v\d+\/bk-portfolio\/projects\/.+\.png$/);
    assert.match(p.mobileImage,/^https:\/\/res\.cloudinary\.com\/dv2hhefed\/image\/upload\/v\d+\/bk-portfolio\/projects\/.+\.png$/);
    assert.ok(p.previewCaption, name + ' screenshot provenance required');
  }
  assert.equal(get(result,'Real-Time Chat System').liveUrl,'');
  assert.equal(get(result,'Secure Authentication System').liveUrl,'');
  assert.equal(result.projects.filter(p=>!p.image).length,0);
  assert.equal(result.projects.filter(p=>!p.liveUrl).length,2);
  assert.equal(result.projects.filter(p=>!p.caseStudy?.summary ||
      !p.caseStudy?.challenge || !p.caseStudy?.outcome ||
      !p.caseStudy?.approach?.length || !p.caseStudy?.architecture?.length ||
      !p.caseStudy?.challenges?.length).length,0);
});
