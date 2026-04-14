export interface ProductPathSource {
  name: string;
  type?: string;
}

export function toSlug(value = ''): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildProductSlug(name = '', type = ''): string {
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

export function buildProductPath(product: ProductPathSource): string {
  return `/product/${buildProductSlug(product.name, product.type || '')}`;
}
