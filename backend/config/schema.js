const bcrypt = require('bcrypt');
const pool = require('./db');
const { buildProductSlug } = require('../utils/product-slug');

async function tableExists(tableName) {
  const [rows] = await pool.query(`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    LIMIT 1
  `, [tableName]);

  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    LIMIT 1
  `, [tableName, columnName]);

  return rows.length > 0;
}

async function constraintExists(constraintName) {
  const [rows] = await pool.query(`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND constraint_name = ?
    LIMIT 1
  `, [constraintName]);

  return rows.length > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.query(`
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND index_name = ?
    LIMIT 1
  `, [tableName, indexName]);

  return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (!await columnExists(tableName, columnName)) {
    await pool.query(`
      ALTER TABLE ${tableName}
      ADD COLUMN ${columnName} ${definition}
    `);
  }
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const userColumns = [
    ['phone', 'VARCHAR(50) NULL AFTER email'],
    ['address_line_1', 'VARCHAR(255) NULL AFTER phone'],
    ['address_line_2', 'VARCHAR(255) NULL AFTER address_line_1'],
    ['city', 'VARCHAR(150) NULL AFTER address_line_2'],
    ['parish', 'VARCHAR(150) NULL AFTER city'],
    ['country', "VARCHAR(150) NULL DEFAULT 'Jamaica' AFTER parish"],
    ['postal_code', 'VARCHAR(50) NULL AFTER country'],
    ['preferred_payment_method', 'VARCHAR(100) NULL AFTER postal_code'],
    ['privacy_consent', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER preferred_payment_method'],
    ['privacy_consent_at', 'DATETIME NULL AFTER privacy_consent']
  ];

  for (const [columnName, definition] of userColumns) {
    if (!await columnExists('users', columnName)) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN ${columnName} ${definition}
      `);
    }
  }
}

async function ensureCategoriesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      slug VARCHAR(180) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('categories', 'slug', "VARCHAR(180) NULL AFTER name");

  await pool.query(`
    UPDATE categories
    SET slug = LOWER(REPLACE(TRIM(name), ' ', '-'))
    WHERE slug IS NULL OR slug = ''
  `);
}

async function ensureProductsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(300) NOT NULL,
      type VARCHAR(150) NULL,
      price DECIMAL(10,2) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      description TEXT NULL,
      notes TEXT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
    )
  `);

  await addColumnIfMissing('products', 'slug', "VARCHAR(300) NULL AFTER name");
  await addColumnIfMissing('products', 'notes', 'TEXT NULL AFTER description');

  const [rows] = await pool.query(`
    SELECT id, name, type, slug
    FROM products
  `);

  for (const row of rows) {
    const nextSlug = buildProductSlug(row.name, row.type || '');

    if (row.slug !== nextSlug) {
      await pool.query(`
        UPDATE products
        SET slug = ?
        WHERE id = ?
      `, [nextSlug, row.id]);
    }
  }

  if (!await indexExists('products', 'idx_products_category_id')) {
    await pool.query(`
      CREATE INDEX idx_products_category_id
      ON products (category_id)
    `);
  }

  if (!await indexExists('products', 'idx_products_slug')) {
    await pool.query(`
      CREATE INDEX idx_products_slug
      ON products (slug)
    `);
  }

  if (!await indexExists('products', 'idx_products_active')) {
    await pool.query(`
      CREATE INDEX idx_products_active
      ON products (is_active)
    `);
  }
}

async function ensureOrdersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      full_name VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NULL,
      notes TEXT NULL,
      delivery_method VARCHAR(50) NOT NULL,
      cod_location VARCHAR(150) NULL,
      payment_method VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) NOT NULL,
      payment_id VARCHAR(100) NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      tax_included DECIMAL(10,2) NOT NULL DEFAULT 0,
      delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('orders', 'user_id', 'INT NULL AFTER id');
  await addColumnIfMissing('orders', 'order_number', 'VARCHAR(50) NULL AFTER user_id');
  await addColumnIfMissing('orders', 'full_name', "VARCHAR(150) NOT NULL DEFAULT '' AFTER order_number");
  await addColumnIfMissing('orders', 'phone', "VARCHAR(50) NOT NULL DEFAULT '' AFTER full_name");
  await addColumnIfMissing('orders', 'email', 'VARCHAR(255) NULL AFTER phone');
  await addColumnIfMissing('orders', 'notes', 'TEXT NULL AFTER email');
  await addColumnIfMissing('orders', 'delivery_method', "VARCHAR(50) NOT NULL DEFAULT 'delivery' AFTER notes");
  await addColumnIfMissing('orders', 'cod_location', 'VARCHAR(150) NULL AFTER delivery_method');
  await addColumnIfMissing('orders', 'payment_method', "VARCHAR(50) NOT NULL DEFAULT 'unknown' AFTER cod_location");
  await addColumnIfMissing('orders', 'payment_status', "VARCHAR(50) NOT NULL DEFAULT 'pending' AFTER payment_method");
  await addColumnIfMissing('orders', 'payment_id', 'VARCHAR(100) NULL AFTER payment_status');
  await addColumnIfMissing('orders', 'subtotal', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER payment_id');
  await addColumnIfMissing('orders', 'tax_included', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER subtotal');
  await addColumnIfMissing('orders', 'delivery_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER tax_included');
  await addColumnIfMissing('orders', 'total', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER delivery_fee');
  await addColumnIfMissing('orders', 'created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER total');

  await pool.query(`
    UPDATE orders
    SET order_number = CONCAT('EOW-LEGACY-', LPAD(id, 6, '0'))
    WHERE order_number IS NULL OR order_number = ''
  `);

  await pool.query(`
    ALTER TABLE orders
    MODIFY COLUMN user_id INT NULL,
    MODIFY COLUMN order_number VARCHAR(50) NOT NULL
  `);

  if (!await indexExists('orders', 'uq_orders_order_number')) {
    await pool.query(`
      ALTER TABLE orders
      ADD CONSTRAINT uq_orders_order_number UNIQUE (order_number)
    `);
  }

  if (await tableExists('users') && !await constraintExists('fk_orders_user')) {
    await pool.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL
    `);
  }
}

async function ensureOrderItemsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_image VARCHAR(500) NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing('order_items', 'product_name', "VARCHAR(255) NOT NULL DEFAULT '' AFTER order_id");
  await addColumnIfMissing('order_items', 'product_image', 'VARCHAR(500) NULL AFTER product_name');
  await addColumnIfMissing('order_items', 'unit_price', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER product_image');
  await addColumnIfMissing('order_items', 'created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER quantity');

  if (await columnExists('order_items', 'product_id')) {
    await pool.query(`
      ALTER TABLE order_items
      MODIFY COLUMN product_id INT NULL
    `);
  }

  if (await columnExists('order_items', 'price')) {
    await pool.query(`
      ALTER TABLE order_items
      MODIFY COLUMN price DECIMAL(10,2) NULL DEFAULT 0
    `);
  }

  if (await columnExists('order_items', 'price')) {
    await pool.query(`
      UPDATE order_items
      SET unit_price = price
      WHERE (unit_price IS NULL OR unit_price = 0) AND price IS NOT NULL
    `);
  }
}

async function ensurePasswordResetTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    )
  `);
}

async function ensureSiteContentTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_key VARCHAR(100) NOT NULL UNIQUE,
      content_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function ensureDefaultAdminUser() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '').trim();
  const name = String(process.env.ADMIN_NAME || 'Site Admin').trim();

  if (!email || !password) {
    return;
  }

  const [rows] = await pool.query(`
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
  `, [email]);

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!rows[0]) {
    await pool.query(`
      INSERT INTO users (name, email, password, role, country, privacy_consent, privacy_consent_at)
      VALUES (?, ?, ?, 'admin', 'Jamaica', 1, NOW())
    `, [name, email, hashedPassword]);
    return;
  }

  await pool.query(`
    UPDATE users
    SET name = ?, password = ?, role = 'admin'
    WHERE id = ?
  `, [name, hashedPassword, rows[0].id]);
}

async function ensureSchema() {
  await ensureUsersTable();
  await ensureCategoriesTable();
  await ensureProductsTable();
  await ensureOrdersTable();
  await ensureOrderItemsTable();
  await ensurePasswordResetTokensTable();
  await ensureSiteContentTable();
  await ensureDefaultAdminUser();
}

module.exports = { ensureSchema };
