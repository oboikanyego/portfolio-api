/**
 * One-time, additive portfolio showcase audit.
 * Only verified publicly deployed links and Cloudinary captures are used.
 * Preserve all admin-authored nonempty content and unpublished statuses.
 */
const known = {
  'freelance-services-platform': {
    image: 'https://res.cloudinary.com/dv2hhefed/image/upload/v1794286667/bk-portfolio/projects/freelance-desktop.webp',
    study: {
      summary: 'Full-stack marketplace for freelance services, client orders and direct messaging.',
      role: 'Angular and Node.js full-stack engineering',
      challenge: 'Coordinate service discovery, client orders and conversations across distinct user roles.',
      approach: ['Developed Angular service listings and order management interfaces.', 'Implemented Node.js APIs, MongoDB persistence and JWT role-based access.', 'Integrated real-time conversations using Socket.IO.'],
      architecture: [{label:'Interface',value:'Angular'}, {label:'API',value:'Node.js and Express'}, {label:'Storage',value:'MongoDB'}, {label:'Live updates',value:'Socket.IO'}],
      challenges: ['Keeping order transitions clear across pending, in-progress and completed states.', 'Enforcing permissions on service and messaging routes.'],
      outcome: 'A deployed portfolio example of a multi-role freelance marketplace with orders and messaging.'
    }
  },
  'dentacare': {
    image: 'https://res.cloudinary.com/dv2hhefed/image/upload/v1794286656/bk-portfolio/projects/dentacare-desktop.webp',
    study: {
      summary: 'Clinic operations concept for appointments, patient information and administration.',
      role: 'Angular and Node.js application engineering',
      challenge: 'Bring scheduling and clinic records into a structured interface.',
      approach: ['Modelled clinic appointment and administrative workflows.', 'Organised a responsive Angular interface around patient and scheduling tasks.', 'Connected frontend flows to Node.js and MongoDB data services.'],
      architecture: [{label:'Interface',value:'Angular'}, {label:'API',value:'Node.js'}, {label:'Data',value:'MongoDB'}],
      challenges: ['Designing clear appointment states and administrative forms.'],
      outcome: 'A clinic workflow demonstration highlighting forms, scheduling and data organisation.'
    }
  },
  'mzansirent': {
    image: 'https://res.cloudinary.com/dv2hhefed/image/upload/v1794286672/bk-portfolio/projects/mzansirent-desktop.webp',
    study: {
      summary: 'Property rental operations platform with tenant, landlord and administrative journeys.',
      role: 'Full-stack product engineering',
      challenge: 'Coordinate property listings, verification, rental applications and operational decisions in one workflow.',
      approach: ['Implemented Angular onboarding and listings interfaces.', 'Built Node.js and MongoDB workflows for applications, verification and admin queues.', 'Integrated Cloudinary media and Paystack billing workflows.'],
      architecture: [{label:'Interface',value:'Angular'}, {label:'API',value:'Node.js and Express'}, {label:'Data',value:'MongoDB'}, {label:'Services',value:'Cloudinary and Paystack'}],
      challenges: ['Keeping landlord/tenant permissions aligned with review and verification states.', 'Representing billing and suspension decisions without confusing the user.'],
      outcome: 'A deployed rental workflow product demonstrating multi-role property operations.'
    }
  },
  'real-time-portfolio-risk-dashboard': {
    liveUrl: 'https://portfolio-risk-monitor.netlify.app/',
    study: {
      summary: 'An evolving dashboard for exploring trading portfolio exposure and real-time risk signals.',
      role: 'Full-stack prototype engineering',
      challenge: 'Turn changing market data and asset exposure into useful risk views.',
      approach: ['Explored streaming prices and portfolio metrics through a Node.js and WebSocket-oriented design.', 'Organised Angular dashboard views around portfolio exposure and trading signals.', 'Planned repeatable storage and deployment workflows for market snapshots.'],
      architecture: [{label:'Interface',value:'Angular'}, {label:'Realtime',value:'Node.js and Socket.IO'}, {label:'Data',value:'SQL and historical snapshots'}, {label:'Ops',value:'Docker'}],
      challenges: ['Handling delayed or missing market data without presenting stale values as current.', 'Separating calculated risk indicators from investment advice.'],
      outcome: 'An evolving technical showcase; simulated and historical analytics are not trading recommendations.'
    }
  },
  'real-time-chat-system': {
    study: {
      summary: 'Real-time messaging application exploring user authentication and socket-driven chat.',
      role: 'Full-stack feature development',
      challenge: 'Deliver responsive conversations while managing sessions and message state.',
      approach: ['Built Angular chat interfaces.', 'Explored Firebase authentication integration.', 'Used Socket.IO with Node.js and MongoDB for realtime messaging and persistence.'],
      architecture: [{label:'Interface',value:'Angular'}, {label:'Transport',value:'Socket.IO'}, {label:'API',value:'Node.js'}, {label:'Data',value:'MongoDB'}],
      challenges: ['Keeping conversation state consistent during reconnects and user navigation.'],
      outcome: 'A messaging feature demonstration; no independently verified public deployment is linked.'
    }
  },
  'secure-authentication-system': {
    study: {
      summary: 'Authentication API concept covering registration, sign-in and secure account recovery.',
      role: 'Backend API and security engineering',
      challenge: 'Protect user sessions and sensitive account operations.',
      approach: ['Implemented JWT-based protected endpoints and credential validation.', 'Used MongoDB to model users and access rights.', 'Designed time-limited password-reset token flows.'],
      architecture: [{label:'API',value:'Node.js and Express'}, {label:'Identity',value:'JWT and password hashing'}, {label:'Storage',value:'MongoDB'}],
      challenges: ['Preventing unintended access across protected routes.', 'Handling password resets without exposing account credentials.'],
      outcome: 'A backend authentication showcase; no independently verified public demo is available.'
    }
  },
  'eathealthy': {
    image: 'https://res.cloudinary.com/dv2hhefed/image/upload/v1794286663/bk-portfolio/projects/eathealthy-desktop.webp'
  }
};
function enhanceShowcase(config) {
  const result = structuredClone(config);
  if (!Array.isArray(result.projects)) return result;
  result.projects = result.projects.map(project => {
    const key = (project.slug || project.name || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const entry = known[key];
    if (!entry) return project;
    const next = { ...project };
    if (!next.image && entry.image) next.image = entry.image;
    if (!next.liveUrl && entry.liveUrl) next.liveUrl = entry.liveUrl;
    if (entry.study) {
      const study = next.caseStudy && typeof next.caseStudy === 'object' ? { ...next.caseStudy } : {};
      for (const [field, value] of Object.entries(entry.study)) {
        if (study[field] === undefined || study[field] === null || study[field] === '' ||
          (Array.isArray(study[field]) && study[field].length === 0)) study[field] = structuredClone(value);
      }
      next.caseStudy = study;
    }
    return next;
  });
  return result;
}
module.exports = { enhanceShowcase, known };
