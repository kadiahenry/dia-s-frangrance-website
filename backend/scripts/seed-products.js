require('dotenv').config();

const pool = require('../config/db');
const products = require('../data/seed-products');
const { toSlug, buildProductSlug } = require('../utils/product-slug');

async function getCategoryId(categoryName) {
  const [rows] = await pool.query(`
    SELECT id
    FROM categories
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
  `, [categoryName]);

  if (rows[0]?.id) {
    return rows[0].id;
  }

  const [result] = await pool.query(`
    INSERT INTO categories (name, slug)
    VALUES (?, ?)
  `, [categoryName, toSlug(categoryName)]);

  return result.insertId;
}

async function upsertProduct(product) {
  const categoryId = await getCategoryId(product.category);
  const [existing] = await pool.query(`
    SELECT id, image_url
    FROM products
    WHERE LOWER(name) = LOWER(?)
      AND LOWER(COALESCE(type, '')) = LOWER(?)
    LIMIT 1
  `, [product.name, product.type || '']);

  if (existing[0]?.id) {
    const currentImageUrl = existing[0].image_url || '';
    const shouldPreserveUploadedImage =
      currentImageUrl.includes('/uploads/') || currentImageUrl.startsWith('uploads/');
    const nextImageUrl = shouldPreserveUploadedImage ? currentImageUrl : product.image;

    await pool.query(`
      UPDATE products
      SET
        category_id = ?,
        slug = ?,
        type = ?,
        price = ?,
        image_url = ?,
        description = ?,
        notes = ?,
        stock_quantity = ?,
        is_active = TRUE
      WHERE id = ?
    `, [
      categoryId,
      buildProductSlug(product.name, product.type || ''),
      product.type || '',
      product.price,
      nextImageUrl,
      product.description || '',
      JSON.stringify(Array.isArray(product.notes) ? product.notes : []),
      product.stock_quantity ?? 0,
      existing[0].id
    ]);

    return { action: 'updated', name: product.name };
  }

  await pool.query(`
    INSERT INTO products
    (category_id, name, slug, type, price, image_url, description, notes, stock_quantity, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
  `, [
    categoryId,
    product.name,
    buildProductSlug(product.name, product.type || ''),
    product.type || '',
    product.price,
    product.image,
    product.description || '',
    JSON.stringify(Array.isArray(product.notes) ? product.notes : []),
    product.stock_quantity ?? 0
  ]);

  return { action: 'inserted', name: product.name };
}

async function main() {
  try {
    const results = [];
    const activeKeys = products.map(product => `${product.name}|||${product.type || ''}`);

    for (const product of products) {
      results.push(await upsertProduct(product));
    }

    const [existingProducts] = await pool.query(`
      SELECT id, name, COALESCE(type, '') AS type
      FROM products
    `);

    for (const product of existingProducts) {
      const key = `${product.name}|||${product.type}`;
      const isActive = activeKeys.includes(key);

      await pool.query(`
        UPDATE products
        SET is_active = ?
        WHERE id = ?
      `, [isActive, product.id]);
    }

    for (const result of results) {
      console.log(`${result.action}: ${result.name}`);
    }

    console.log('archived products not in seed list');
  } catch (error) {
    console.error('Product seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
