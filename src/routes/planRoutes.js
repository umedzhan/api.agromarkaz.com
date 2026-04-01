const express = require('express');
const { getAIPlan } = require('../controllers/planController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Faqat tizimga kirgan foydalanuvchilar foydalana oladi
router.post('/', protect, getAIPlan);

module.exports = router;
