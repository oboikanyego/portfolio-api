const REQUIRED = ['profile','social','home','about','contact','footer','careerSteps','projects','technologies'];
const CLOUDINARY_HOST = 'res.cloudinary.com';
function validPublicUrl(url, image = false) {
  if (!url) return true;
  if (typeof url !== 'string' || url.length > 2048) return false;
  try {
    const value = new URL(url);
    if (value.protocol !== 'https:') return false;
    return image ? value.hostname === CLOUDINARY_HOST && value.pathname.startsWith('/dv2hhefed/image/upload/') : true;
  } catch { return false; }
}
function validateSiteConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return 'A valid content configuration is required.';
  if (REQUIRED.some(key => config[key] === undefined)) return 'The portfolio content is missing a required section.';
  if (!Array.isArray(config.projects) || config.projects.length > 100) return 'Projects must be an array of at most 100 entries.';
  if (!Array.isArray(config.careerSteps) || !Array.isArray(config.technologies) || !Array.isArray(config.about?.story)) return 'Career, technology and about entries must be lists.';
  const slugs = new Set();
  for (const p of config.projects) {
    if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 150) return 'Every project needs a name under 150 characters.';
    if (typeof p.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) return 'Every project needs a valid URL slug.';
    if (slugs.has(p.slug)) return 'Project URLs must be unique.';
    slugs.add(p.slug);
    if (typeof p.description !== 'string' || p.description.length > 5000 || typeof p.stack !== 'string' || p.stack.length > 500) return 'Check the project description and technologies.';
    if (!validPublicUrl(p.liveUrl) || !validPublicUrl(p.githubUrl)) return 'Project links must use valid HTTPS URLs.';
    if (!validPublicUrl(p.image, true) || !validPublicUrl(p.mobileImage, true)) return 'Project images must use your Cloudinary account.';
    if (!Array.isArray(p.gallery || []) || (p.gallery || []).length > 12 || !(p.gallery || []).every(x => validPublicUrl(x, true))) return 'Each project can have up to 12 Cloudinary gallery images.';
    if (!p.caseStudy || typeof p.caseStudy !== 'object' || Array.isArray(p.caseStudy)) return 'Every project needs a case-study content object.';
    if (p.caseStudy.architecture !== undefined && (!Array.isArray(p.caseStudy.architecture) || p.caseStudy.architecture.length > 12)) return 'Project architecture must be a short list.';
    for (const key of ['approach','users','constraints','challenges','quality','lessons']) {
      if (p.caseStudy[key] !== undefined && (!Array.isArray(p.caseStudy[key]) || p.caseStudy[key].length > 30 || !p.caseStudy[key].every(x=>typeof x==='string' && x.length <= 2000))) return 'Check project case-study list fields.';
    }
  }
  if (!validPublicUrl(config.profile?.profileImage, true)) return 'Profile image must be hosted on Cloudinary.';
  if (!validPublicUrl(config.social?.github) || !validPublicUrl(config.social?.linkedin)) return 'Social links must use valid HTTPS URLs.';
  return null;
}
module.exports = { validateSiteConfig, validPublicUrl };
