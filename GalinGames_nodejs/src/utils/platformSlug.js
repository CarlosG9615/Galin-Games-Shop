const SLUG_TO_PLATFORM = {
  pc: 'PC',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  nintendo: 'Nintendo',
};

function resolvePlatform(slug) {
  if (typeof slug !== 'string') return null;
  return SLUG_TO_PLATFORM[slug.toLowerCase()] || null;
}

module.exports = { resolvePlatform, SLUG_TO_PLATFORM };
