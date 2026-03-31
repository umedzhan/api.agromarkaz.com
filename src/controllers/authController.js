const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { full_name, email, username, phone_number, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user
        user = await User.create({
            full_name,
            email,
            username,
            phone_number,
            password,
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                username: user.username,
                role: user.role,
                phone_number: user.phone_number
            }
        });
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

        // Check for user
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                username: user.username,
                role: user.role,
                phone_number: user.phone_number
            }
        });
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

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        
        // Destructure user info from google payload
        const { sub: google_id, email, name, picture } = payload;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Register new user via Google
            // Since username and phone_number are required by design, we might need a workaround. 
            // We use email as default username or generate one. Phone number might be empty for google auth, 
            // so we set a default or leave it empty if schema allows. Schema requires phone_number.
            // Let's set a default empty or prompt user later. We will set placeholder values.
            user = await User.create({
                full_name: name,
                email,
                username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
                phone_number: 'N/A: Google Auth', // Requires phone number in schema
                google_id,
                profile_pic: picture,
                // password is not required if google_auth
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                full_name: user.full_name,
                email: user.email,
                username: user.username,
                role: user.role,
                profile_pic: user.profile_pic,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
