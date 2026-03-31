const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate Access Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '15m', // Access token odatda qisqa yashaydi
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d', // Refresh uzoq
    });
};

// Helper: Response yuborish va tokenlarni saqlash
const sendTokenResponse = async (user, statusCode, res) => {
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Refresh tokenni bazaga ham yozib qo'yamiz
    user.refresh_token = refreshToken;
    await user.save();

    res.status(statusCode).json({
        success: true,
        token,
        refreshToken,
        user: {
            id: user._id,
            full_name: user.full_name,
            email: user.email,
            username: user.username,
            role: user.role,
            phone_number: user.phone_number,
            profile_pic: user.profile_pic
        }
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { full_name, email, username, phone_number, password } = req.body;

        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = await User.create({
            full_name,
            email,
            username,
            phone_number,
            password,
        });

        sendTokenResponse(user, 201, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Google Auth (Register/Login)
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ success: false, message: 'No ID token provided' });
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: google_id, email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                full_name: name,
                email,
                username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
                phone_number: 'N/A: Google Auth',
                google_id,
                profile_pic: picture,
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Refresh new token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(403).json({ success: false, message: 'Refresh token is required' });
    }

    try {
        // Refresh token ni validligini tekshirish
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }

        // Yana bitta qo'shimcha xavfsizlik (agar log out qilmagan bo'lsa)
        if (user.last_logout) {
            const issuedAt = new Date(decoded.iat * 1000);
            if (issuedAt <= user.last_logout) {
                return res.status(403).json({ success: false, message: 'Token qabul qilinmadi (logout qilingan)' });
            }
        }

        // Agar hammasi joyida bo'lsa, faqatgina yangi Access Token beramiz
        const newAccessToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            token: newAccessToken
        });
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Logout user / clear token
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            last_logout: new Date(),
            refresh_token: null // Refresh tokenni hamma xavfsizlik uchun o'chirish ham mumkin
        });

        res.status(200).json({
            success: true,
            message: 'Serverdan muvaffaqiyatli chiqildi. Sizning eski tokengiz qabul qilinmaydi.',
            token: null,
            refreshToken: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
