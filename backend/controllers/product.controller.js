const pool = require('../config/db');
const seedProducts = require('../data/seed-products');
const { toSlug, buildProductSlug } = require('../utils/product-slug');

const productDetailsMap = new Map(
  seedProducts.map(product => [
    `${product.name.toLowerCase()}|||${(product.type || '').toLowerCase()}`,
    {
      description: product.description || '',
      notes: Array.isArray(product.notes) ? product.notes : []
    }
  ])
);

async function resolveCategoryId(categoryId, categoryName) {
  if (categoryId) {
    return categoryId;
  }

  if (!categoryName) {
    return null;
  }

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
  `, [categoryName.trim(), toSlug(categoryName)]);

  return result.insertId || null;
}

function mapProduct(row) {
  let savedNotes = [];

  if (typeof row.notes === 'string' && row.notes.trim()) {
    try {
      const parsedNotes = JSON.parse(row.notes);
      savedNotes = Array.isArray(parsedNotes) ? parsedNotes : [];
    } catch {
      savedNotes = row.notes
        .split(',')
        .map(note => note.trim())
        .filter(Boolean);
    }
  }

  const details = productDetailsMap.get(
    `${row.name.toLowerCase()}|||${(row.type || '').toLowerCase()}`
  ) || { description: row.description, notes: [] };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    price: Number(row.price),
    image: row.image_url,
    image_url: row.image_url,
    category: row.category_name,
    category_name: row.category_name,
    description: row.description || details.description,
    notes: savedNotes.length ? savedNotes : details.notes,
    stock_quantity: row.stock_quantity,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category_id: row.category_id
  };
}

/**
 * Get all active products
 * Includes category name for easier frontend display
 */
async function getProducts(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.slug,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.description,
        p.notes,
        p.stock_quantity,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ORDER BY p.id DESC
    `);

    res.json(rows.map(mapProduct));
  } catch (error) {
    next(error);
  }
}

/**
 * Get one product by id
 */
async function getProductById(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.slug,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.description,
        p.notes,
        p.stock_quantity,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * Get one product by slug
 */
async function getProductBySlug(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.slug,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.description,
        p.notes,
        p.stock_quantity,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
        AND p.is_active = TRUE
      LIMIT 1
    `, [req.params.slug]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * Create product
 */
async function createProduct(req, res, next) {
  try {
    const {
      name,
      type,
      price,
      image,
      image_url,
      category,
      category_id,
      description,
      notes,
      stock_quantity,
      is_active
    } = req.body;

    const resolvedImageUrl = image_url || image;
    const resolvedCategoryId = await resolveCategoryId(category_id, category);

    if (!name || price === undefined || !resolvedImageUrl || !resolvedCategoryId) {
      return res.status(400).json({
        message: 'Name, price, image/image_url, and category/category_id are required'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO products
      (category_id, name, slug, type, price, image_url, description, notes, stock_quantity, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resolvedCategoryId,
      name,
      buildProductSlug(name, type || ''),
      type || '',
      price,
      resolvedImageUrl,
      description || '',
      JSON.stringify(Array.isArray(notes) ? notes : []),
      stock_quantity ?? 0,
      is_active ?? true
    ]);

    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.slug,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.description,
        p.notes,
        p.stock_quantity,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `, [result.insertId]);

    res.status(201).json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * Update product
 */
async function updateProduct(req, res, next) {
  try {
    const {
      name,
      type,
      price,
      image,
      image_url,
      category,
      category_id,
      description,
      notes,
      stock_quantity,
      is_active
    } = req.body;

    const resolvedImageUrl = image_url || image;
    const resolvedCategoryId = await resolveCategoryId(category_id, category);

    if (!name || price === undefined || !resolvedImageUrl || !resolvedCategoryId) {
      return res.status(400).json({
        message: 'Name, price, image/image_url, and category/category_id are required'
      });
    }

    const [result] = await pool.query(`
      UPDATE products
      SET
        category_id = ?,
        name = ?,
        slug = ?,
        type = ?,
        price = ?,
        image_url = ?,
        description = ?,
        notes = ?,
        stock_quantity = ?,
        is_active = ?
      WHERE id = ?
    `, [
      resolvedCategoryId,
      name,
      buildProductSlug(name, type || ''),
      type || '',
      price,
      resolvedImageUrl,
      description || '',
      JSON.stringify(Array.isArray(notes) ? notes : []),
      stock_quantity ?? 0,
      is_active ?? true,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.slug,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.description,
        p.notes,
        p.stock_quantity,
        p.is_active,
        p.created_at,
        p.updated_at,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
      LIMIT 1
    `, [req.params.id]);

    res.json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * Best practice:
 * soft delete product instead of removing it permanently
 */
async function deleteProduct(req, res, next) {
  try {
    const [result] = await pool.query(`
      UPDATE products
      SET is_active = FALSE
      WHERE id = ?
    `, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Optional helper route for admin dashboard:
 * get out-of-stock products
 */
async function getOutOfStockProducts(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.stock_quantity,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity = 0
        AND p.is_active = TRUE
      ORDER BY p.name ASC
    `);

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

/**
 * Optional helper route for admin dashboard:
 * low stock products
 */
async function getLowStockProducts(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.type,
        p.price,
        p.image_url,
        p.stock_quantity,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity BETWEEN 1 AND 5
        AND p.is_active = TRUE
      ORDER BY p.stock_quantity ASC
    `);

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getOutOfStockProducts,
  getLowStockProducts
};
