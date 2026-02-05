const express = require('express');
const { getChat, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/:ideaId', protect, getChat);
router.post('/send', protect, sendMessage);

module.exports = router;
