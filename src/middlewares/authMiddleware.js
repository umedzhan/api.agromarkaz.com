const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
        }

        // Agar user tokenni olgan paytidan keyin biron marta logout qilgan bo'lsa
        if (user.last_logout) {
            const issuedAt = new Date(decoded.iat * 1000);
            // tokenning berilgan vaqtidan keyin 'logout' tugmasini bosgan bo'lsa
            if (issuedAt <= user.last_logout) {
                return res.status(401).json({ success: false, message: 'Token eskirgan. Iltimos qaytadan login qiling' });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};
