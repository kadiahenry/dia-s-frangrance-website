const express = require('express');
const protect = require('../middleware/auth.middleware');
const adminOnly = require('../middleware/admin.middleware');
const { getHomeContent, updateHomeContent } = require('../controllers/home-content.controller');

const router = express.Router();

router.get('/', getHomeContent);
router.put('/', protect, adminOnly, updateHomeContent);

module.exports = router;
