const express = require('express');
const { getWeather } = require('../controllers/weatherController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// protect - faqatgina tizimga kirganlargina oby-havoni kura olishi uchun!
router.get('/', protect, getWeather);

module.exports = router;
