const express = require('express');

const protect = require('../middleware/auth.middleware');
const {
  registerCustomer,
  customerLogin,
  adminLogin,
  requestPasswordReset,
  resetPassword,
  logout,
  getCurrentUser,
  updateCurrentUser
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login', customerLogin);
router.post('/admin-login', adminLogin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, updateCurrentUser);

module.exports = router;
