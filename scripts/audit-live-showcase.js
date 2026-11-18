// Public production project-evidence audit; prints no contacts, credentials or private records.
const base = process.env.PORTFOLIO_PUBLIC_API || 'https://portfolio-api-d2en.onrender.com';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(url, method='GET', attempt=0) {
  try {
    const res = await fetch(url, { method, redirect:'follow', signal:AbortSignal.timeout(27000),
      headers: { 'user-agent':'portfolio-showcase-audit/1.0' } });
    if (res.status >= 500 && attempt < 3) throw new Error('HTTP ' + res.status);
    return res;
  } catch(error) {
    if (attempt === 3) throw error;
    await sleep((attempt+1)*3000);
    return request(url,method,attempt+1);
  }
}
async function main() {
  // Wake Render first; the free tier can sleep and needs additional time for MongoDB.
  const health = await request(base + '/api/health');
  if (!health.ok) throw new Error('Render health: HTTP '+health.status);
  const response = await request(base + '/api/site-config');
  if (!response.ok) throw new Error('Portfolio config: HTTP '+response.status);
  const payload = await response.json();
  const projects = payload.config?.projects;
  if (!Array.isArray(projects) || projects.length === 0) throw new Error('Published project list is missing');
  console.log('PUBLISHED CONTENT', JSON.stringify({version:payload.contentVersion, count:projects.length,updatedAt:payload.updatedAt}));
  const audit = [];
  for (const p of projects) {
    const study=p.caseStudy || {};
    const missingCaseStudy=['summary','role','challenge','outcome'].filter(k=>!study[k])
      .concat(['approach','architecture','challenges'].filter(k=>!study[k]?.length));
    const info={
      name:p.name,slug:p.slug,published:p.published!==false,githubUrl:p.githubUrl||null,
      liveUrl:p.liveUrl||null,image:p.image||null,mobileImage:p.mobileImage||null,
      missingCaseStudy
    };
    if(p.liveUrl){
      try {
        const r=await request(p.liveUrl,'GET');
        info.liveHttpStatus=r.status;
        info.liveRedirectedTo=r.url;
      } catch(e) { info.liveHttpStatus='ERROR: '+e.message.slice(0,90); }
    }
    audit.push(info);
    console.log('PROJECT',JSON.stringify(info));
  }
  console.log('SUMMARY',JSON.stringify({
    missingCovers:audit.filter(x=>!x.image).map(x=>x.name),
    missingDemos:audit.filter(x=>!x.liveUrl).map(x=>x.name),
    incompleteCaseStudies:audit.filter(x=>x.missingCaseStudy.length).map(x=>({name:x.name,fields:x.missingCaseStudy})),
    failingOrUnreachableDemos:audit.filter(x=>x.liveUrl && x.liveHttpStatus!==200).map(x=>({name:x.name,http:x.liveHttpStatus}))
  }));
}
main().catch(error=>{console.error('SHOWCASE AUDIT FAILED:',error.message);process.exitCode=1;});
