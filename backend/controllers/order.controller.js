const pool = require('../config/db');
const { ensureSchema } = require('../config/schema');

function generateOrderNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `EOW-${random}`;
}

async function columnExists(executor, tableName, columnName) {
  const [rows] = await executor.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    LIMIT 1
  `, [tableName, columnName]);

  return rows.length > 0;
}

async function indexExists(executor, tableName, indexName) {
  const [rows] = await executor.query(`
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND index_name = ?
    LIMIT 1
  `, [tableName, indexName]);

  return rows.length > 0;
}

async function ensureOrderNumberColumn(executor) {
  if (!await columnExists(executor, 'orders', 'order_number')) {
    await executor.query(`
      ALTER TABLE orders
      ADD COLUMN order_number VARCHAR(50) NULL AFTER user_id
    `);
  }

  await executor.query(`
    UPDATE orders
    SET order_number = CONCAT('EOW-LEGACY-', LPAD(id, 6, '0'))
    WHERE order_number IS NULL OR order_number = ''
  `);

  await executor.query(`
    ALTER TABLE orders
    MODIFY COLUMN order_number VARCHAR(50) NOT NULL
  `);

  if (!await indexExists(executor, 'orders', 'uq_orders_order_number')) {
    await executor.query(`
      ALTER TABLE orders
      ADD CONSTRAINT uq_orders_order_number UNIQUE (order_number)
    `);
  }
}

function normalizeItems(items = []) {
  return items
    .filter(item => item && item.name && Number(item.qty || item.quantity) > 0)
    .map(item => ({
      name: String(item.name).trim(),
      image: item.image || '',
      price: Number(item.price),
      quantity: Number(item.qty || item.quantity)
    }));
}

function mapItemsByOrder(items) {
  return items.reduce((acc, item) => {
    acc[item.order_id] = acc[item.order_id] || [];
    acc[item.order_id].push({
      name: item.product_name,
      image: item.product_image,
      price: Number(item.unit_price),
      qty: item.quantity
    });
    return acc;
  }, {});
}

async function createOrder(req, res, next) {
  let connection;

  try {
    await ensureSchema();
    connection = await pool.getConnection();
    const {
      fullName,
      phone,
      email,
      notes,
      deliveryMethod,
      codLocation,
      paymentMethod,
      paymentStatus,
      paymentId,
      subtotal,
      taxIncluded,
      deliveryFee,
      total,
      items
    } = req.body;

    const normalizedItems = normalizeItems(items);

    if (!fullName || !phone || !deliveryMethod || !paymentMethod || !normalizedItems.length) {
      return res.status(400).json({ message: 'Order details are incomplete.' });
    }

    const orderNumber = generateOrderNumber();

    await ensureOrderNumberColumn(connection);
    await connection.beginTransaction();

    const [orderResult] = await connection.query(`
      INSERT INTO orders (
        user_id,
        order_number,
        full_name,
        phone,
        email,
        notes,
        delivery_method,
        cod_location,
        payment_method,
        payment_status,
        payment_id,
        subtotal,
        tax_included,
        delivery_fee,
        total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user?.id || null,
      orderNumber,
      fullName.trim(),
      phone.trim(),
      email?.trim() || null,
      notes?.trim() || null,
      deliveryMethod,
      codLocation || null,
      paymentMethod,
      paymentStatus || 'pending',
      paymentId || null,
      Number(subtotal || 0),
      Number(taxIncluded || 0),
      Number(deliveryFee || 0),
      Number(total || 0)
    ]);

    for (const item of normalizedItems) {
      await connection.query(`
        INSERT INTO order_items (
          order_id,
          product_name,
          product_image,
          unit_price,
          quantity
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        orderResult.insertId,
        item.name,
        item.image,
        item.price,
        item.quantity
      ]);
    }

    await connection.commit();

    res.status(201).json({
      id: orderResult.insertId,
      orderNumber
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function listOrders(req, res, next) {
  try {
    await ensureSchema();
    await ensureOrderNumberColumn(pool);

    const [orders] = await pool.query(`
      SELECT
        id,
        user_id,
        order_number,
        full_name,
        phone,
        email,
        delivery_method,
        cod_location,
        payment_method,
        payment_status,
        payment_id,
        subtotal,
        tax_included,
        delivery_fee,
        total,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const [items] = await pool.query(`
      SELECT
        order_id,
        product_name,
        product_image,
        unit_price,
        quantity
      FROM order_items
      ORDER BY id ASC
    `);

    const itemsByOrderId = mapItemsByOrder(items);

    res.json(orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      tax_included: Number(order.tax_included),
      delivery_fee: Number(order.delivery_fee),
      total: Number(order.total),
      items: itemsByOrderId[order.id] || []
    })));
  } catch (error) {
    next(error);
  }
}

async function listMyOrders(req, res, next) {
  try {
    await ensureSchema();
    await ensureOrderNumberColumn(pool);

    const [orders] = await pool.query(`
      SELECT
        id,
        order_number,
        full_name,
        phone,
        email,
        delivery_method,
        cod_location,
        payment_method,
        payment_status,
        payment_id,
        subtotal,
        tax_included,
        delivery_fee,
        total,
        created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    if (!orders.length) {
      return res.json([]);
    }

    const [items] = await pool.query(`
      SELECT
        order_id,
        product_name,
        product_image,
        unit_price,
        quantity
      FROM order_items
      WHERE order_id IN (?)
      ORDER BY id ASC
    `, [orders.map(order => order.id)]);

    const itemsByOrderId = mapItemsByOrder(items);

    res.json(orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      tax_included: Number(order.tax_included),
      delivery_fee: Number(order.delivery_fee),
      total: Number(order.total),
      items: itemsByOrderId[order.id] || []
    })));
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const [orders] = await pool.query(`
      SELECT
        id,
        user_id,
        order_number,
        full_name,
        phone,
        email,
        notes,
        delivery_method,
        cod_location,
        payment_method,
        payment_status,
        payment_id,
        subtotal,
        tax_included,
        delivery_fee,
        total,
        created_at
      FROM orders
      WHERE id = ?
      LIMIT 1
    `, [req.params.id]);

    if (!orders[0]) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const [items] = await pool.query(`
      SELECT
        order_id,
        product_name,
        product_image,
        unit_price,
        quantity
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `, [req.params.id]);

    const order = orders[0];
    const itemsByOrderId = mapItemsByOrder(items);

    res.json({
      ...order,
      subtotal: Number(order.subtotal),
      tax_included: Number(order.tax_included),
      delivery_fee: Number(order.delivery_fee),
      total: Number(order.total),
      items: itemsByOrderId[order.id] || []
    });
  } catch (error) {
    next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const paymentStatus = String(req.body.paymentStatus || '').trim();
    const deliveryMethod = String(req.body.deliveryMethod || '').trim();
    const codLocation = String(req.body.codLocation || '').trim();

    const [result] = await pool.query(`
      UPDATE orders
      SET
        payment_status = COALESCE(NULLIF(?, ''), payment_status),
        delivery_method = COALESCE(NULLIF(?, ''), delivery_method),
        cod_location = COALESCE(?, cod_location)
      WHERE id = ?
    `, [
      paymentStatus,
      deliveryMethod,
      codLocation || null,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return getOrderById(req, res, next);
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(`
      DELETE FROM order_items
      WHERE order_id = ?
    `, [req.params.id]);

    const [result] = await connection.query(`
      DELETE FROM orders
      WHERE id = ?
    `, [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found.' });
    }

    await connection.commit();
    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    connection?.release();
  }
}

module.exports = {
  createOrder,
  listOrders,
  listMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder
};
