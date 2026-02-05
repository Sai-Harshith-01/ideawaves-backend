const express = require('express');
const { createIdea, getIdeas, getIdeaById, markAsCompleted, getLeaderboard, deleteIdea } = require('../controllers/ideaController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');

router.route('/')
 .post(protect, upload.single('image'), createIdea)
 .get(protect, getIdeas);

router.get('/leaderboard', protect, getLeaderboard);
router.get('/:id', protect, getIdeaById);
router.put('/:id/complete', protect, markAsCompleted);
router.delete('/:id', protect, deleteIdea);

module.exports = router;
