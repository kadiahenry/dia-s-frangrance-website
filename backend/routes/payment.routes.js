const express = require('express');
const {
  getPayPalConfig,
  createPayPalOrder,
  capturePayPalOrder
} = require('../controllers/payment.controller');

const router = express.Router();

router.get('/paypal/config', getPayPalConfig);
router.post('/paypal/orders', createPayPalOrder);
router.post('/paypal/orders/:orderId/capture', capturePayPalOrder);

module.exports = router;
