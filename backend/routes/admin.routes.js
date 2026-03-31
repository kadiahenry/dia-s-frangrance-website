const express = require('express');
const protect = require('../middleware/auth.middleware');
const adminOnly = require('../middleware/admin.middleware');
const { getDashboardData } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/dashboard', protect, adminOnly, getDashboardData);

module.exports = router;
