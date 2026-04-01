const express = require('express');
const { getWeather, getWeatherAI } = require('../controllers/weatherController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// protect - faqatgina tizimga kirganlargina oby-havoni kura olishi uchun!
router.get('/', protect, getWeather);
router.get('/ai', protect, getWeatherAI);

module.exports = router;
