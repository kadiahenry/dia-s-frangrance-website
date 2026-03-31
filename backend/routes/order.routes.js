const express = require('express');

const protect = require('../middleware/auth.middleware');
const adminOnly = require('../middleware/admin.middleware');
const {
  createOrder,
  listOrders,
  listMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder
} = require('../controllers/order.controller');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my', protect, listMyOrders);
router.get('/:id', protect, adminOnly, getOrderById);
router.put('/:id', protect, adminOnly, updateOrder);
router.delete('/:id', protect, adminOnly, deleteOrder);
router.get('/admin/list', protect, adminOnly, listOrders);

module.exports = router;
