const OpenAI = require('openai');

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

// @desc    Get AI-generated weather description (Meteosource + OpenAI)
// @route   GET /api/weatherai?lat=...&lon=...
// @access  Private
exports.getWeatherAI = async (req, res) => {
    try {
        const { lat, lon, lang } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'Iltimos kenglik (lat) va uzunlik (lon) ni jo\'nating. Masalan: ?lat=41.2995&lon=69.2401'
            });
        }

        const apiKey = process.env.METEOSOURCE_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) return res.status(500).json({ success: false, message: 'METEOSOURCE_API_KEY topilmadi' });
        if (!openaiKey) return res.status(500).json({ success: false, message: 'OPENAI_API_KEY topilmadi' });

        // 1. Meteosource-dan ob-havo ma'lumotini olish
        const url = `https://www.meteosource.com/api/v1/free/point?lat=${lat}&lon=${lon}&language=en&key=${apiKey}`;
        const weatherResponse = await fetch(url);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            return res.status(weatherResponse.status).json({
                success: false,
                message: 'Ob-havo API dan xatolik keldi',
                error: weatherData
            });
        }

        // 2. Olingan ma'lumotni sodda matnli ko'rinishga o'tkazish
        const current = weatherData.current;
        const weatherSummary = JSON.stringify({
            temperature: current?.temperature,
            feels_like: current?.feels_like,
            summary: current?.summary,
            wind_speed: current?.wind?.speed,
            wind_dir: current?.wind?.dir,
            cloud_cover: current?.cloud_cover?.total,
            precipitation: current?.precipitation?.total,
            humidity: current?.humidity,
            visibility: current?.visibility,
            uv_index: current?.uv_index,
        });

        // 3. OpenAI ga jo'natish
        const openai = new OpenAI({ apiKey: openaiKey });
        const language = lang === 'uz' ? 'uzbek' : lang === 'ru' ? 'russian' : 'english';

        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a friendly weather assistant. Based on the weather JSON data provided, write a clear, warm, and informative weather summary for the user in ${language}. 
                    Include: current temperature, how it feels, sky conditions, wind, humidity, and any recommendations (like take an umbrella, wear a jacket, etc). 
                    Keep it concise (3-5 sentences) and use friendly tone. Do NOT return JSON.`
                },
                {
                    role: 'user',
                    content: `Current weather data: ${weatherSummary}`
                }
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        const aiText = aiResponse.choices[0]?.message?.content || '';

        res.status(200).json({
            success: true,
            weather: weatherData,
            ai_summary: aiText
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
