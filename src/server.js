const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Require routes
const authRoutes = require('./routes/authRoutes');

// Connect to database
// Note: We don't call this right away, let's call it just before starting the server.

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: ['https://agromarkaz.com', 'http://localhost:5173'], // faqat shu domendan qabul qiladi
    credentials: true
}));

// Mount routers
app.use('/api/auth', authRoutes);

// Error handling middleware (very basic)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

const PORT = process.env.PORT || 5000;

// Connect to DB then start server
connectDB().then(() => {
    app.listen(PORT, console.log(`Server running on port ${PORT}`));
}).catch(err => {
    console.log(err);
});
