function toSlug(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildProductSlug(name = '', type = '') {
  const nameSlug = toSlug(name);
  const typeSlug = toSlug(type);

  if (!typeSlug) {
    return nameSlug || 'product';
  }

  if (nameSlug === typeSlug || nameSlug.endsWith(`-${typeSlug}`)) {
    return nameSlug || 'product';
  }

  return toSlug(`${nameSlug} ${typeSlug}`) || 'product';
}

module.exports = {
  toSlug,
  buildProductSlug
};
