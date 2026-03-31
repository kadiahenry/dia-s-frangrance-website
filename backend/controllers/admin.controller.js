const pool = require('../config/db');

async function getDashboardData(req, res, next) {
  try {
    const [[{ totalOrders = 0, totalRevenue = 0 } = {}]] = await pool.query(`
      SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total), 0) AS totalRevenue
      FROM orders
    `);

    const [[{ totalUsers = 0 } = {}]] = await pool.query(`
      SELECT COUNT(*) AS totalUsers
      FROM users
    `);

    const [[{ totalCustomers = 0 } = {}]] = await pool.query(`
      SELECT COUNT(DISTINCT COALESCE(NULLIF(email, ''), CONCAT('phone:', phone))) AS totalCustomers
      FROM orders
    `);

    const [recentOrders] = await pool.query(`
      SELECT
        id,
        order_number,
        full_name,
        email,
        phone,
        payment_method,
        payment_status,
        total,
        created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const [customers] = await pool.query(`
      SELECT
        full_name,
        email,
        phone,
        MAX(created_at) AS last_order_at,
        COUNT(*) AS orders_count,
        SUM(total) AS total_spent
      FROM orders
      GROUP BY full_name, email, phone
      ORDER BY last_order_at DESC
      LIMIT 10
    `);

    const [users] = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        totalOrders,
        totalRevenue: Number(totalRevenue),
        totalUsers,
        totalCustomers
      },
      recentOrders: recentOrders.map(order => ({
        ...order,
        total: Number(order.total)
      })),
      customers: customers.map(customer => ({
        ...customer,
        total_spent: Number(customer.total_spent || 0)
      })),
      users
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardData };
