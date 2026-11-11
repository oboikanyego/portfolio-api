/**
 * v8: evidence-backed additions from the actual public GitHub repositories.
 * Never manufacture a live deployment or overwrite nonempty administrator edits.
 * Existing project slugs and publish flags stay stable.
 */
const { known } = require('./showcase-audit');

const eatHealthyStudy = {
  summary: 'A South African budget-aware meal planning prototype that uses familiar foods, dietary preferences, pantry items and grocery budgets to suggest practical daily plans.',
  role: 'Full-stack prototype engineering · Angular 20, Node.js, Express and TypeScript',
  challenge: 'Create useful meal plans that respect food exclusions, an everyday schedule and grocery spending constraints without depending on a paid AI subscription.',
  users: ['People planning affordable meals', 'Busy households and commuters', 'People managing dietary preferences and exclusions'],
  constraints: [
    'Calories and grocery costs are estimates, not medical or live retailer data',
    'Allergy and excluded-food filtering must happen before meals are recommended',
    'MongoDB persistence is optional; the in-memory fallback is not durable',
    'Workout programmes and calorie diary features belong to a later phase'
  ],
  approach: [
    'Implemented deterministic meal filtering and scoring based on familiarity, cost, pantry reuse and nutrition estimates.',
    'Built Angular 20 standalone forms for food preferences, budget, goal and activity level.',
    'Added 7-, 10- and 14-day schedules, consolidated shopping lists and daily meal tracking.',
    'Supported Excel schedule imports and optional MongoDB plan persistence in the Express API.'
  ],
  architecture: [
    { label: 'Interface', value: 'Angular 20 and Angular Material' },
    { label: 'API', value: 'Node.js, Express and TypeScript' },
    { label: 'Planner', value: 'Deterministic food scoring and schedule generation' },
    { label: 'Data', value: 'Optional MongoDB; in-memory demo fallback' },
    { label: 'Schedule import', value: 'SheetJS .xlsx parser' }
  ],
  challenges: [
    'Balancing affordable meal combinations with pantry reuse, exclusions and target energy estimates.',
    'Communicating the limits of estimated prices and nutrition rather than implying medical accuracy.',
    'Maintaining a functional demo without MongoDB while clearly distinguishing non-durable data.'
  ],
  outcome: 'Phase 1 meal-planning prototype with budget estimates, shopping lists, recipe-video links and schedule import. Authentication, production reminders and the broader workout programme remain future work.',
  quality: [
    'Test allergy and exclusion filters before presenting planned meals.',
    'Verify that Excel imports retain the intended schedule structure.',
    'Clearly label estimated nutritional and grocery values and memory-only demo mode.'
  ],
  lessons: [
    'A transparent, deterministic planner can be practical without a paid AI service.',
    'Budget and data-persistence limitations should be visible instead of buried in setup instructions.'
  ]
};

const correctedChatStudy = {
  summary: 'A repository-backed Angular and Express foundation for a planned authenticated messaging platform; the present UI demonstrates deployment and API health, not completed chat conversations.',
  role: 'Architecture and full-stack foundation engineering',
  challenge: 'Establish frontend, backend and deployment boundaries before implementing persistent authenticated conversations.',
  approach: [
    'Scaffolded a standalone Angular frontend with an API health-check interface.',
    'Prepared an Express and Socket.IO API with MongoDB and Firebase integration boundaries.',
    'Documented local Docker and hosted Netlify/Render deployment configuration.'
  ],
  architecture: [
    { label: 'Current UI', value: 'Angular application shell and API health check' },
    { label: 'Current API', value: 'Node.js and Express scaffold' },
    { label: 'Planned messaging', value: 'Socket.IO, MongoDB and Firebase authentication' },
    { label: 'Operations', value: 'Docker, Netlify and Render configuration' }
  ],
  challenges: [
    'Separating architectural preparation from implemented features when demonstrating progress.',
    'Making credential and service prerequisites explicit before enabling authenticated messaging.'
  ],
  outcome: 'A buildable architecture scaffold with project documentation. Login, conversations, presence, read receipts and persistent messages are planned milestones, not completed features.'
};

const correctedAuthStudy = {
  summary: 'A reusable authentication and access-control implementation demonstrated inside the FreelanceHub Node.js backend, not a separate deployed application.',
  role: 'Backend authentication and permissions engineering',
  challenge: 'Support registration, login, role-based authorization and account recovery within a marketplace API.',
  approach: [
    'Implemented registration with bcrypt password hashes and signed JWT login tokens.',
    'Applied JWT verification and freelancer/buyer role checks to protected API routes.',
    'Added forgot-password and expiring reset-token endpoints using email notifications.'
  ],
  architecture: [
    { label: 'API', value: 'Express and Node.js (FreelanceHub backend)' },
    { label: 'Credentials', value: 'bcrypt password hashing' },
    { label: 'Sessions', value: 'JWT bearer-token verification' },
    { label: 'Authorization', value: 'Buyer and freelancer role checks' },
    { label: 'Storage', value: 'MongoDB and Mongoose user records' }
  ],
  challenges: [
    'Rejecting invalid or expired tokens before privileged endpoints run.',
    'Applying role permissions consistently to marketplace features.',
    'Maintaining a recoverable password flow without sending credentials in plain text.'
  ],
  outcome: 'Repository-backed authentication endpoints and permission middleware used in FreelanceHub. This is an integrated backend module, not an independent live app or security certification.'
};

const riskStudyCorrections = {
  summary: 'Live Angular portfolio-risk dashboard with public Kraken market data, portfolio valuation, allocation and concentration indicators, plus educational trading research.',
  role: 'Full-stack market-data dashboard and research engineering',
  challenge: 'Present exposure, valuation and risk from time-varying market feeds without mistaking delayed data or speculative signals for real-time guarantees.',
  approach: [
    'Built Angular portfolio dashboards and Socket.IO updates from Kraken public USD spot data.',
    'Calculated holdings value, profit/loss, allocation and concentration against sample portfolio models.',
    'Added optional MongoDB snapshots and authenticated personal portfolio/transaction workflows.',
    'Implemented weekly research, a trading academy and a simulated paper-trading desk with explicit data freshness checks.'
  ],
  architecture: [
    { label: 'Frontend', value: 'Angular dashboard and education workspace' },
    { label: 'API', value: 'Node.js, Express and Socket.IO' },
    { label: 'Market feed', value: 'Kraken public spot quotes and completed candles' },
    { label: 'Persistence', value: 'MongoDB for accounts, snapshots and portfolio records' },
    { label: 'Research', value: 'Conditional signals and simulated trading exercises' }
  ],
  outcome: 'A deployed educational risk dashboard with portfolio monitoring and paper-trading workflows. Historical research and simulated trades are not evidence of investment returns.'
};

function blank(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}
function fillMissing(obj, values) {
  for (const [key,value] of Object.entries(values)) {
    if (blank(obj[key])) obj[key] = structuredClone(value);
  }
}
function upgradeKnownDefaults(study, key, corrections) {
  const baseline=known[key]?.study || {};
  for (const [field,latest] of Object.entries(corrections)) {
    if (blank(study[field]) || (baseline[field] !== undefined &&
        JSON.stringify(study[field]) === JSON.stringify(baseline[field]))) {
      study[field] = structuredClone(latest);
    }
  }
}

function completeVerifiedShowcase(config) {
  const next=structuredClone(config);
  if(!Array.isArray(next.projects)) return next;
  for(const project of next.projects) {
    const slug=(project.slug || project.name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const study=project.caseStudy && typeof project.caseStudy === 'object'
      ? project.caseStudy : (project.caseStudy={});
    if (slug === 'eathealthy') {
      fillMissing(study,eatHealthyStudy);
    }
    if (slug === 'real-time-portfolio-risk-dashboard') {
      // Risk UI repository is private; avoid sending visitors to an inaccessible source link.
      if(project.stack === 'Angular · Node.js · Socket.IO · SQL · Docker')
        project.stack='Angular · Node.js · Express · Socket.IO · MongoDB · Kraken API';
      upgradeKnownDefaults(study,slug,riskStudyCorrections);
      if (blank(project.previewCaption)) project.previewCaption='Live Portfolio Risk dashboard · public model holdings';
      if(blank(project.image))project.image='https://res.cloudinary.com/dv2hhefed/image/upload/v1794398264/bk-portfolio/projects/portfolio-risk-desktop.png';
      if(blank(project.mobileImage))project.mobileImage='https://res.cloudinary.com/dv2hhefed/image/upload/v1794398271/bk-portfolio/projects/portfolio-risk-mobile.png';
    }
    if (slug === 'real-time-chat-system') {
      if(blank(project.githubUrl))project.githubUrl='https://github.com/oboikanyego/real-time-chat-system';
      if(project.description === 'A real-time messaging feature that allows users to communicate instantly through a responsive chat interface.')
        project.description='An Angular and Express architecture foundation for a future authenticated chat platform, with deployment scaffolding and a working API health-check interface.';
      upgradeKnownDefaults(study,slug,correctedChatStudy);
      if(blank(project.previewCaption))project.previewCaption='Authentic locally built Angular scaffold · not a live chat demo';
      if(blank(project.image))project.image='https://res.cloudinary.com/dv2hhefed/image/upload/v1794398278/bk-portfolio/projects/chat-foundation-desktop.png';
      if(blank(project.mobileImage))project.mobileImage='https://res.cloudinary.com/dv2hhefed/image/upload/v1794398285/bk-portfolio/projects/chat-foundation-mobile.png';
    }
    if (slug === 'secure-authentication-system') {
      if(blank(project.githubUrl))project.githubUrl='https://github.com/oboikanyego/Freelance-Services-Platform_server';
      if(project.description === 'A secure authentication system with registration, login, email verification, short-lived password-reset tokens, and protected routes.')
        project.description='JWT registration, login, role checks and password recovery demonstrated inside the FreelanceHub backend; not a standalone deployed application.';
      upgradeKnownDefaults(study,slug,correctedAuthStudy);
      if(blank(project.previewCaption))project.previewCaption='FreelanceHub sign-in screen · related implementation';
      if(blank(project.image))project.image='https://res.cloudinary.com/dv2hhefed/image/upload/v1794398292/bk-portfolio/projects/freelance-auth-desktop.png';
      if(blank(project.mobileImage))project.mobileImage='https://res.cloudinary.com/dv2hhefed/image/upload/v1794398300/bk-portfolio/projects/freelance-auth-mobile.png';
    }
  }
  return next;
}
module.exports={completeVerifiedShowcase,eatHealthyStudy,correctedChatStudy,correctedAuthStudy,riskStudyCorrections};
