const express = require('express');
const {
 sendJoinRequest,
 getReceivedRequests,
 getSentRequests,
 approveRequest,
 rejectRequest,
} = require('../controllers/requestController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/send', protect, sendJoinRequest);
router.get('/received', protect, getReceivedRequests);
router.get('/sent', protect, getSentRequests);
router.post('/approve', protect, approveRequest);
router.post('/reject', protect, rejectRequest);

module.exports = router;
