const express = require('express');
const { chat } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Faqat tizimga kirgan foydalanuvchilar chat qilishi mumkin
router.post('/', protect, chat);

module.exports = router;
