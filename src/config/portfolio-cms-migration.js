/**
 * One-time migration of existing repository portfolio content into MongoDB.
 * After v5, all edits come from the authenticated CMS; this file is not applied again.
 * Media was copied from the actual deployed portfolio captures to Cloudinary.
 */
const curatedProjects = [
  {
    "name": "KasiDrop",
    "stack": "Ionic · Angular · Node.js · Express · MongoDB · PayFast",
    "description": "A South African e-commerce experience with a mobile storefront, product search, checkout and AI-assisted shopping.",
    "liveUrl": "https://kasi-drop.netlify.app/",
    "githubUrl": "https://github.com/oboikanyego/kasi-drop-ui",
    "image": "assets/images/projects/kasidrop-live.webp",
    "featured": true
  },
  {
    "name": "Mzansi Rent Lite",
    "stack": "Angular · Node.js · Express · MongoDB",
    "description": "A focused property discovery and rental application platform with landlord, tenant and operations workflows.",
    "liveUrl": "https://mzansi-rent.netlify.app/",
    "image": "assets/images/projects/mzansi-rent-lite-live.webp",
    "featured": true
  },
  {
    "name": "Genesis Kiddies Corner",
    "stack": "Ionic · Angular · Node.js · Express · MongoDB",
    "description": "An event services and equipment booking website for children’s parties, school events and local celebrations.",
    "liveUrl": "https://genesis-kiddies-corner2.netlify.app/",
    "githubUrl": "https://github.com/oboikanyego/genesis-kiddies-corner-ui",
    "image": "assets/images/projects/genesis-kiddies-corner-live.webp",
    "featured": true
  },
  {
    "name": "Royal Treats",
    "stack": "Angular · TypeScript · Node.js · Express · MongoDB",
    "description": "A mobile-first dessert ordering storefront with product customisation, collection and local delivery, backed by admin and courier workflows.",
    "liveUrl": "https://royal-treats.netlify.app/",
    "githubUrl": "https://github.com/oboikanyego/royal-treats-ui",
    "image": "assets/images/projects/royal-treats-live.webp",
    "featured": true
  }
];
const authoredCaseStudies = {
  "royal-treats": {
    "summary": "A mobile-first dessert commerce platform for menu browsing, customisable orders, collection and nearby delivery.",
    "role": "Full-stack product engineering",
    "challenge": "Build a simple customer ordering journey while handling availability, delivery eligibility, stock and staff operations reliably.",
    "users": [
      "Customers",
      "Shop administrators",
      "Delivery couriers"
    ],
    "constraints": [
      "Only eligible products can be delivered within the configured radius",
      "Stock and pricing must be determined by the API",
      "Render free-plan services may sleep when idle"
    ],
    "approach": [
      "Designed responsive Angular shopping, basket and checkout experiences for desktop and mobile.",
      "Connected the storefront to a Node.js and MongoDB API controlling stock, prices, orders and roles.",
      "Implemented ordering safeguards, idempotent checkout requests, service wake-up feedback and separate admin/courier workflows."
    ],
    "challenges": [
      "Avoiding duplicate orders when a customer retries after a lost response.",
      "Keeping customer feedback understandable while the backend starts after inactivity."
    ],
    "quality": [
      "Validate menu, checkout, collection and delivery restrictions across screen sizes.",
      "Exercise account, admin and courier permissions with realistic API responses."
    ],
    "lessons": [
      "Business rules for pricing and availability belong on the server.",
      "Clear loading states and idempotent writes improve confidence during unreliable connections."
    ],
    "outcome": "Delivered a responsive storefront and staff operations experience that demonstrates practical commerce workflows, secure API decisions and customer-focused design."
  },
  "genesis-kiddies-corner": {
    "summary": "A responsive event booking website for children’s parties, schools and community celebrations.",
    "role": "Full-stack application engineering",
    "challenge": "Make service discovery and booking requests easier for families, schools and event organisers.",
    "users": [
      "Parents and families",
      "Schools",
      "Community event organisers",
      "Operations administrators"
    ],
    "constraints": [
      "Clear service and equipment availability",
      "Usable mobile layouts",
      "Affordable operating infrastructure"
    ],
    "approach": [
      "Organised equipment and entertainment services around an accessible catalogue.",
      "Built responsive booking and enquiry flows for event organisers.",
      "Connected public booking journeys to administrative service management."
    ],
    "outcome": "Delivered a customer-facing booking application with a clear route from browsing to an enquiry.",
    "quality": [
      "Validate booking data and availability before confirming requests.",
      "Test mobile forms and service wake-up."
    ],
    "lessons": [
      "Simple booking steps matter more than overwhelming users with options."
    ]
  },
  "kasidrop": {
    "summary": "An e-commerce application focused on South African shoppers, with mobile-first shopping, product administration and AI-assisted discovery.",
    "role": "Product direction, Angular/Ionic interface and Node.js API engineering",
    "challenge": "Connect catalogue discovery, checkout, account favourites and administration without fragmenting the mobile shopping journey.",
    "users": [
      "Shoppers",
      "Store administrators"
    ],
    "constraints": [
      "Payment verification must be server-side",
      "AI features need provider fallbacks and graceful failure",
      "Product availability must be managed centrally"
    ],
    "approach": [
      "Separated catalogue, checkout, favourites and administration concerns.",
      "Integrated PayFast sandbox flows and improved product editing and filtering.",
      "Moved favourites toward user-backed persistence and added customer feedback workflows."
    ],
    "challenges": [
      "Payment notification signature mismatches required careful end-to-end verification; sandbox flow does not prove live payment readiness."
    ],
    "quality": [
      "Validate cart and checkout transitions, payment callbacks and mobile layouts before declaring production-ready."
    ],
    "outcome": "Built an evolving commerce product demonstrating product decisions, payment integration and real-world iteration.",
    "lessons": [
      "Payments require idempotency and independent confirmation.",
      "Slow AI responses need clear fallback behaviour."
    ]
  },
  "mzansi-rent-lite": {
    "summary": "A focused rental marketplace and operations workflow for tenants and landlords.",
    "role": "Full-stack product engineering",
    "challenge": "Make property listing, application review and account roles understandable without overscoping the initial release.",
    "users": [
      "Tenants",
      "Landlords",
      "Operations administrators"
    ],
    "constraints": [
      "Affordable infrastructure",
      "Role-aware access to sensitive workflows"
    ],
    "approach": [
      "Separated Angular UI and Node.js API deployments.",
      "Defined landlord, tenant and operations journeys.",
      "Improved production API environment consistency and mobile navigation."
    ],
    "outcome": "Delivered a small, deployable end-to-end rental product suitable for iterative testing.",
    "quality": [
      "Verify role permissions and application state transitions.",
      "Test service wake-up and mobile user journeys."
    ],
    "lessons": [
      "Operational clarity matters more than feature count."
    ]
  },
  "real-time-portfolio-risk-dashboard": {
    "summary": "An evolving market-risk and trader analysis dashboard.",
    "role": "Full-stack experimental product engineering",
    "challenge": "Translate changing market data into understandable portfolio signals and risk context.",
    "users": [
      "Self-directed traders and portfolio researchers"
    ],
    "constraints": [
      "Market feeds may be delayed",
      "AI analysis is exploratory and should not be presented as guaranteed trade signals"
    ],
    "approach": [
      "Modelled portfolio exposure and streaming display needs.",
      "Explored WebSocket-driven updates and analysis workflows."
    ],
    "outcome": "Work in progress; no audited strategy performance or returns are claimed.",
    "quality": [
      "Backtest against historical data and document assumptions before quoting signal quality."
    ],
    "lessons": [
      "Distinguish observed metrics from model-generated recommendations."
    ]
  },
  "freelance-services-platform": {
    "summary": "A two-sided services marketplace connecting clients who need work delivered with freelancers ready to provide it.",
    "role": "Full-stack product engineering",
    "challenge": "Bring project posting, service discovery, authentication, and direct communication into one coherent workflow for two distinct user groups.",
    "approach": [
      "Separated client and freelancer journeys while keeping shared account behaviour consistent.",
      "Designed REST API boundaries around projects, services, authentication, and messaging.",
      "Built reusable Angular interfaces for data-heavy workflows and responsive use."
    ],
    "outcome": "Delivered a working end-to-end marketplace experience that demonstrates multi-role product design, API integration, and maintainable full-stack structure."
  },
  "dentacare": {
    "summary": "A clinic operations platform that brings appointments, patient records, and administration into a structured digital workspace.",
    "role": "Full-stack product engineering",
    "challenge": "Turn connected clinical and administrative tasks into workflows that remain clear for staff while protecting the integrity of patient and appointment data.",
    "approach": [
      "Modelled clinic operations around clear patient, appointment, and administrative responsibilities.",
      "Used reusable Angular views and validation to reduce ambiguity during data entry.",
      "Connected the interface to a Node.js and MongoDB backend designed around the clinic workflow."
    ],
    "outcome": "Produced a focused clinic-management experience that demonstrates structured data handling, workflow-oriented UI design, and full-stack delivery."
  },
  "mzansirent": {
    "summary": "A South African rental operations platform serving tenants, landlords, property managers, and administrators.",
    "role": "Full-stack product and workflow engineering",
    "users": [
      "Tenants",
      "Landlords",
      "Property managers",
      "Administrators"
    ],
    "constraints": [
      "Role-specific access",
      "Payment and document security",
      "Complex state transitions"
    ],
    "challenges": [
      "Synchronising rental status, payment events and operational review queues without letting the client unilaterally change sensitive states."
    ],
    "quality": [
      "Validate permissions and rejected transitions at API boundaries.",
      "Test payment and file-upload failure paths."
    ],
    "lessons": [
      "Server-owned state machines reduce inconsistent workflows.",
      "Auditability belongs in the domain design."
    ],
    "challenge": "Coordinate property operations across several roles while keeping applications, leases, maintenance, payments, documents, and state transitions reliable.",
    "approach": [
      "Designed server-controlled state transitions for sensitive rental workflows.",
      "Integrated Paystack, Cloudinary, and Socket.IO for payments, document handling, and real-time updates.",
      "Added reporting, audit trails, role-based access, inspections, deposits, and refund flows around a shared domain model."
    ],
    "outcome": "Delivered a broad operational platform that demonstrates complex workflow modelling, third-party integrations, role-based security, and end-to-end product ownership."
  }
};
const mediaUrls = {
  "assets/images/BK.jpeg": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286651/bk-portfolio/profile/bk.webp",
  "assets/images/BK.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286651/bk-portfolio/profile/bk.webp",
  "assets/images/projects/DentaCare.png": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286656/bk-portfolio/projects/dentacare-desktop.webp",
  "assets/images/projects/DentaCare.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286656/bk-portfolio/projects/dentacare-desktop.webp",
  "assets/images/projects/EatHealthy.png": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286663/bk-portfolio/projects/eathealthy-desktop.webp",
  "assets/images/projects/EatHealthy.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286663/bk-portfolio/projects/eathealthy-desktop.webp",
  "assets/images/projects/freelancing-app.png": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286667/bk-portfolio/projects/freelance-desktop.webp",
  "assets/images/projects/freelancing-app.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286667/bk-portfolio/projects/freelance-desktop.webp",
  "assets/images/projects/mzanzi-rent.png": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286672/bk-portfolio/projects/mzansirent-desktop.webp",
  "assets/images/projects/mzanzi-rent.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286672/bk-portfolio/projects/mzansirent-desktop.webp",
  "assets/images/projects/kasidrop-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286626/kasidrop-desktop.webp",
  "assets/images/projects/mzansi-rent-lite-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286677/bk-portfolio/projects/rent-lite-desktop.webp",
  "assets/images/projects/genesis-kiddies-corner-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286683/bk-portfolio/projects/genesis-desktop.webp",
  "assets/images/projects/royal-treats-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286689/bk-portfolio/projects/royal-treats-desktop.webp",
  "assets/images/projects/mobile/kasidrop-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286694/bk-portfolio/projects/kasidrop-mobile.webp",
  "assets/images/projects/mobile/mzansi-rent-lite-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286700/bk-portfolio/projects/rent-lite-mobile.webp",
  "assets/images/projects/mobile/genesis-kiddies-corner-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286707/bk-portfolio/projects/genesis-mobile.webp",
  "assets/images/projects/mobile/royal-treats-live.webp": "https://res.cloudinary.com/dv2hhefed/image/upload/v1794286711/bk-portfolio/projects/royal-treats-mobile.webp"
};
const mobileSources = {
  "kasidrop": "assets/images/projects/mobile/kasidrop-live.webp",
  "mzansi-rent-lite": "assets/images/projects/mobile/mzansi-rent-lite-live.webp",
  "genesis-kiddies-corner": "assets/images/projects/mobile/genesis-kiddies-corner-live.webp",
  "royal-treats": "assets/images/projects/mobile/royal-treats-live.webp"
};
function slugify(name) {
  return String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function cloudinaryUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (mediaUrls[raw]) return mediaUrls[raw];
  // Do not keep known broken placeholder references as live screenshots.
  if (raw === 'assets/images/projects/authentication.jpg' || /YOUR-USERNAME|YOUR-CHAT-PROJECT/.test(raw)) return '';
  return raw;
}
function migratePortfolioCms(config, defaults) {
  const next = JSON.parse(JSON.stringify(config || defaults));
  const original = Array.isArray(next.projects) ? next.projects : [];
  const bySlug = new Map(original.map(p => [slugify(p.slug || p.name), p]));
  for (const fromCode of curatedProjects) {
    const slug = slugify(fromCode.name);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { ...fromCode });
    } else {
      const existing = bySlug.get(slug);
      for (const field of ['liveUrl','githubUrl','stack','description']) {
        if (!existing[field] && fromCode[field]) existing[field] = fromCode[field];
      }
      if (!existing.image && fromCode.image) existing.image = fromCode.image;
    }
  }
  const featuredOrder = ['kasidrop','mzansi-rent-lite','genesis-kiddies-corner','royal-treats','mzansirent'];
  next.projects = Array.from(bySlug.values()).map((value, index) => {
    const slug = slugify(value.slug || value.name);
    const curated = curatedProjects.find(p => slugify(p.name) === slug);
    const rawImage = value.image || curated?.image || '';
    const photo = cloudinaryUrl(rawImage);
    const knownMobile = mobileSources[slug];
    const mobileImage = cloudinaryUrl(value.mobileImage || knownMobile || '');
    const caseStudy = value.caseStudy && typeof value.caseStudy === 'object'
      ? value.caseStudy
      : authoredCaseStudies[slug] || {};
    return {
      ...value,
      slug,
      published: value.published !== false,
      featured: value.featured === true || Boolean(curated?.featured),
      order: featuredOrder.includes(slug) ? featuredOrder.indexOf(slug) : 20 + index,
      image: photo,
      mobileImage,
      gallery: Array.isArray(value.gallery) ? value.gallery : [],
      caseStudy
    };
  }).sort((a,b) => a.order - b.order);
  if (next.profile) {
    next.profile.profileImage = cloudinaryUrl(next.profile.profileImage) || mediaUrls['assets/images/BK.webp'];
  }
  return next;
}
module.exports = { migratePortfolioCms, slugify, cloudinaryUrl, curatedProjects, authoredCaseStudies, mediaUrls };
