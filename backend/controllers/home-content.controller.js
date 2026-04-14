const pool = require('../config/db');

const defaultContent = {
  heroImage: 'assets/images/backgroundpic-home.jpg',
  newArrivals: [
    { name: 'In The Sun', price: 1800, image: 'assets/uploads/1774148769316-in-the-sun-set-removebg-preview.webp' },
    { name: 'Pearberry', price: 1800, image: 'assets/uploads/1774148446103-pearberry-set.webp' },
    { name: 'Bahamas Passionfruit', price: 1800, image: 'assets/uploads/1774983663459-bahamas-passionfruit-set--2-.webp' }
  ],
  bestSellers: [
    { name: 'Cucumber Melon', price: 1800, image: 'assets/uploads/1774983545707-cucumbermelonn.webp' },
    { name: 'Thousand Wishes', price: 1800, image: 'assets/images/thousand-wishes-card.jpg' },
    { name: 'Gingham', price: 1800, image: 'assets/images/gingham-card.jpg' }
  ],
  categories: [
    { name: 'Fragrances', image: 'assets/uploads/1774148463864-fragrances.webp' },
    { name: 'Body Wash', image: 'assets/uploads/1774148750036-bodywash-removebg-preview.webp' },
    { name: 'Lotion and Body Cream', image: 'assets/uploads/1774148480432-lotion-body-cream.webp' }
  ]
};
const SHOWCASE_ITEM_COUNT = 3;
const CATEGORY_ITEM_COUNT = 3;

function cloneContent(content) {
  return {
    heroImage: content.heroImage,
    newArrivals: content.newArrivals.map(item => ({ ...item })),
    bestSellers: content.bestSellers.map(item => ({ ...item })),
    categories: content.categories.map(item => ({ ...item }))
  };
}

function normalizeContent(content = {}) {
  const fallback = cloneContent(defaultContent);

  return {
    heroImage: typeof content.heroImage === 'string' && content.heroImage.trim()
      ? optimizeImagePath(content.heroImage.trim())
      : fallback.heroImage,
    newArrivals: normalizeShowcaseItems(content.newArrivals, fallback.newArrivals),
    bestSellers: normalizeShowcaseItems(content.bestSellers, fallback.bestSellers),
    categories: normalizeCategoryItems(content.categories, fallback.categories)
  };
}

function normalizeShowcaseItems(items, fallback) {
  const normalized = Array.isArray(items)
    ? items
      .map(item => ({
        name: String(item?.name || '').trim(),
        image: normalizeShowcaseImage(String(item?.name || '').trim(), String(item?.image || '').trim()),
        price: Number(item?.price) || 0
      }))
      .filter(item => item.name && item.image)
    : [];

  return fillWithFallback(normalized, fallback, SHOWCASE_ITEM_COUNT);
}

function normalizeCategoryItems(items, fallback) {
  const normalized = Array.isArray(items)
    ? items
      .map(item => ({
        name: String(item?.name || '').trim(),
        image: optimizeImagePath(String(item?.image || '').trim())
      }))
      .filter(item => item.name && item.image)
    : [];

  return fillWithFallback(normalized, fallback, CATEGORY_ITEM_COUNT);
}

function fillWithFallback(items, fallback, count) {
  const nextItems = items.slice(0, count).map(item => ({ ...item }));

  for (const fallbackItem of fallback) {
    if (nextItems.length >= count) {
      break;
    }

    nextItems.push({ ...fallbackItem });
  }

  return nextItems;
}

function optimizeImagePath(path = '') {
  const normalizedPath = String(path).replace(/\\/g, '/');

  if (normalizedPath.includes('1774148769316-in-the-sun-set-removebg-preview.webp')) {
    return 'assets/uploads/1774148769316-in-the-sun-set-removebg-preview.webp';
  }

  if (normalizedPath.includes('1774148446103-pearberry-set.webp')) {
    return 'assets/uploads/1774148446103-pearberry-set.webp';
  }

  if (normalizedPath.includes('1774983663459-bahamas-passionfruit-set--2-.webp')) {
    return 'assets/uploads/1774983663459-bahamas-passionfruit-set--2-.webp';
  }

  if (normalizedPath.includes('1774983545707-cucumbermelonn.webp')) {
    return 'assets/uploads/1774983545707-cucumbermelonn.webp';
  }

  if (normalizedPath.includes('1774148463864-fragrances.webp')) {
    return 'assets/uploads/1774148463864-fragrances.webp';
  }

  if (normalizedPath.includes('1774148750036-bodywash-removebg-preview.webp')) {
    return 'assets/uploads/1774148750036-bodywash-removebg-preview.webp';
  }

  if (normalizedPath.includes('1774148480432-lotion-body-cream.webp')) {
    return 'assets/uploads/1774148480432-lotion-body-cream.webp';
  }

  if (normalizedPath.endsWith('/backgroundpic.jpg') || normalizedPath.includes('backgroundpic.webp')) {
    return 'assets/images/backgroundpic-home.jpg';
  }

  if (normalizedPath.endsWith('/thousand-wishes.jpg') || normalizedPath.includes('thousand-wishes.webp')) {
    return 'assets/images/thousand-wishes-card.jpg';
  }

  if (
    normalizedPath.endsWith('/gihnam.jpg')
    || normalizedPath.includes('gihnam.webp')
  ) {
    return 'assets/images/gingham-card.jpg';
  }

  return path;
}

function normalizeShowcaseImage(name = '', imagePath = '') {
  const normalizedImagePath = optimizeImagePath(imagePath);
  const normalizedName = String(name).trim().toLowerCase();

  if (
    normalizedName === 'cucumber melon'
    && (!normalizedImagePath || normalizedImagePath === 'assets/images/gingham-card.jpg')
  ) {
    return 'assets/uploads/1774983545707-cucumbermelonn.webp';
  }

  return normalizedImagePath;
}

async function getStoredHomeContent() {
  const [rows] = await pool.query(`
    SELECT content_json
    FROM site_content
    WHERE content_key = 'home-page'
    LIMIT 1
  `);

  if (!rows.length) {
    return cloneContent(defaultContent);
  }

  try {
    return normalizeContent(JSON.parse(rows[0].content_json));
  } catch {
    return cloneContent(defaultContent);
  }
}

async function getHomeContent(req, res, next) {
  try {
    res.json(await getStoredHomeContent());
  } catch (error) {
    next(error);
  }
}

async function updateHomeContent(req, res, next) {
  try {
    const content = normalizeContent(req.body);

    await pool.query(`
      INSERT INTO site_content (content_key, content_json)
      VALUES ('home-page', ?)
      ON DUPLICATE KEY UPDATE
        content_json = VALUES(content_json),
        updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(content)]);

    res.json(content);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHomeContent,
  updateHomeContent
};
