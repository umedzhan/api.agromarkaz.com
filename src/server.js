const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const authRoutes = require('./routes/authRoutes');

const app = express();

// Body parser
app.use(express.json());

// CORS
app.use(cors({
    origin: [
        'https://agromarkaz.com',
        'https://www.agromarkaz.com',
        'http://localhost:5173'
    ],
    credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/chatai', require('./routes/chatRoutes'));
app.use('/api/aiplan', require('./routes/planRoutes'));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

// 🔥 ENG MUHIM QISM
connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // 🔥 TIMEOUTLARNI OSHIRAMIZ
    server.timeout = 300000;           // 5 minut
    server.keepAliveTimeout = 300000;  // 5 minut
    server.headersTimeout = 310000;    // keepAlive'dan katta bo'lishi kerak

}).catch(err => {
    console.log(err);
});