const express = require('express');
const { register, login, googleAuth, refreshToken, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
