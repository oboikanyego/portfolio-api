/** Report only safe, public showcase metadata for deployment verification. */
function summarizePublicConfig(document) {
  const projects = Array.isArray(document?.config?.projects) ? document.config.projects : [];
  const byName = name => projects.find(project => project.name === name);
  const captureValid = (name, liveUrl, image) => {
    const p = byName(name);
    return Boolean(p && p.liveUrl === liveUrl && (
      p.image === image ||
      (typeof p.image === 'string' && /^https:\/\/res\.cloudinary\.com\/dv2hhefed\/image\/upload\//.test(p.image))
    ));
  };
  return {
    contentVersion: document?.contentVersion ?? null,
    projectCount: projects.length,
    cloudinaryImages: projects.filter(p => /^https:\/\/res\.cloudinary\.com\/dv2hhefed\/image\/upload\//.test(p.image || '')).length,
    profileCloudinary: /^https:\/\/res\.cloudinary\.com\/dv2hhefed\/image\/upload\//.test(document?.config?.profile?.profileImage || ''),
    hasVerifiedKasiDrop: captureValid(
      'KasiDrop', 'https://kasi-drop.netlify.app/', 'assets/images/projects/kasidrop-live.webp'
    ),
    hasVerifiedRentLite: captureValid(
      'Mzansi Rent Lite', 'https://mzansi-rent.netlify.app/', 'assets/images/projects/mzansi-rent-lite-live.webp'
    ),
    hasVerifiedGenesis: captureValid(
      'Genesis Kiddies Corner', 'https://genesis-kiddies-corner2.netlify.app/', 'assets/images/projects/genesis-kiddies-corner-live.webp'
    )
  };
}

module.exports = { summarizePublicConfig };
