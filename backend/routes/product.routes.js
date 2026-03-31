const express = require('express');
const protect = require('../middleware/auth.middleware');
const adminOnly = require('../middleware/admin.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getOutOfStockProducts,
  getLowStockProducts
} = require('../controllers/product.controller');

const router = express.Router();

router.get('/', getProducts);
router.get('/out-of-stock/list', protect, adminOnly, getOutOfStockProducts);
router.get('/low-stock/list', protect, adminOnly, getLowStockProducts);
router.get('/:id', getProductById);

router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;