// @desc    Get current weather from Meteosource
// @route   GET /api/weather?lat=...&lon=...
// @access  Private (Faqat kirgan userlar)
exports.getWeather = async (req, res) => {
    try {
        const { lat, lon } = req.query;

        // lat yoki lon kelmasa xato qaytaramiz
        if (!lat || !lon) {
            return res.status(400).json({ 
                success: false, 
                message: 'Iltimos kenglik (lat) va uzunlik (lon) ni jo\'nating. Masalan: ?lat=41.2995&lon=69.2401' 
            });
        }

        const apiKey = process.env.METEOSOURCE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                success: false, 
                message: 'METEOSOURCE_API_KEY topilmadi, iltimos serverda so\'zlamalarni tekshiring.' 
            });
        }

        // Meteosource Free API 
        const url = `https://www.meteosource.com/api/v1/free/point?lat=${lat}&lon=${lon}&language=en&key=${apiKey}`;

        // Node.js 18+ da "fetch" orqali so'rov yuborish mumkin
        const weatherResponse = await fetch(url);
        const data = await weatherResponse.json();

        if (!weatherResponse.ok) {
            return res.status(weatherResponse.status).json({ 
                success: false, 
                message: 'Ob-havo API dan xatolik keldi', 
                error: data 
            });
        }

        res.status(200).json({
            success: true,
            weather: data
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
