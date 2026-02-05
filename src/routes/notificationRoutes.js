const express = require('express');
const { getNotifications } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', protect, getNotifications);

module.exports = router;
