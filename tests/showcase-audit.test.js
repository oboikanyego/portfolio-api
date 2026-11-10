const test = require('node:test');
const assert = require('node:assert/strict');
const defaults = require('../src/config/default-site-config');
const { migratePortfolioCms } = require('../src/config/portfolio-cms-migration');
const { enhanceShowcase } = require('../src/config/showcase-audit');

test('showcase audit adds grounded case studies to older projects without inventing screenshots', () => {
  const v5 = migratePortfolioCms(defaults, defaults);
  const v6 = enhanceShowcase(v5);
  assert.equal(v6.projects.length, v5.projects.length);
  for(const name of ['Freelance Services Platform','DentaCare','MzansiRent']) {
    const project=v6.projects.find(p=>p.name===name);
    assert.ok(project.caseStudy.approach.length>0);
    assert.ok(project.caseStudy.challenges.length>0);
    assert.ok(project.caseStudy.architecture.length>0);
    assert.ok(project.caseStudy.outcome);
  }
  const risk=v6.projects.find(p=>p.name==='Real-Time Portfolio Risk Dashboard');
  assert.equal(risk.liveUrl,'https://portfolio-risk-monitor.netlify.app/');
  const auth=v6.projects.find(p=>p.name==='Secure Authentication System');
  assert.equal(auth.image,'');
  assert.equal(auth.liveUrl,'');
  assert.deepEqual(enhanceShowcase(v6),v6);
});

test('showcase audit never overwrites custom admin content or new projects', () => {
  const v5=migratePortfolioCms(defaults,defaults);
  v5.projects[0].image='https://res.cloudinary.com/dv2hhefed/image/upload/custom.jpg';
  v5.projects[0].caseStudy={ summary:'Author edited', approach:['Author decision'] };
  v5.projects.push({name:'My Custom Project',slug:'my-custom-project',description:'Custom copy',stack:'Angular',published:false});
  const v6=enhanceShowcase(v5);
  assert.equal(v6.projects[0].image,v5.projects[0].image);
  assert.equal(v6.projects[0].caseStudy.summary,'Author edited');
  assert.deepEqual(v6.projects[0].caseStudy.approach,['Author decision']);
  assert.deepEqual(v6.projects.at(-1),v5.projects.at(-1));
});

test('curated case studies receive truthful architecture/challenge detail without overriding existing text', () => {
  const v5 = migratePortfolioCms(defaults,defaults);
  const result = enhanceShowcase(v5);
  for (const name of ['KasiDrop','Mzansi Rent Lite','Genesis Kiddies Corner','Royal Treats']) {
    const project=result.projects.find(p=>p.name===name);
    assert.ok(project?.caseStudy?.architecture?.length >= 3,name);
    assert.ok(project.caseStudy.challenges?.length > 0,name);
    assert.ok(project.caseStudy.outcome,name);
  }
  const edited=structuredClone(v5);
  const kasi=edited.projects.find(p=>p.name==='KasiDrop');
  kasi.caseStudy.architecture=[{label:'My design',value:'Author-approved'}];
  assert.deepEqual(enhanceShowcase(edited).projects.find(p=>p.name==='KasiDrop').caseStudy.architecture,
    [{label:'My design',value:'Author-approved'}]);
});
