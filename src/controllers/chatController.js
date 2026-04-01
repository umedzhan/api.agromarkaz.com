const OpenAI = require('openai');

// @desc    Chat with AI (OpenAI)
// @route   POST /api/chatai
// @access  Private
exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Savol (message) maydoni bo\'sh bo\'lmasligi kerak'
            });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return res.status(500).json({ success: false, message: 'OPENAI_API_KEY topilmadi' });
        }

        const openai = new OpenAI({ apiKey: openaiKey });

        // Avvalgi suhbat tarixi (history) qo'llab-quvvatlanadi
        // history = [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
        const messages = [
            {
                role: 'system',
                content: `Siz agro sohasiga ixtisoslashgan sun’iy intellektsiz. Siz faqat quyidagi mavzularda javob berishingiz mumkin:

Qishloq xo‘jaligi (agro) savollari
Ekin ekish, parvarish qilish, sug‘orish
O‘g‘itlash, oziqlantirish me’yorlari
Ob-havo va uning ekinlarga ta’siri
Zararkunandalarga qarshi kurash
Chorvachilik va agro maslahatlar
Umuman barcha agroga oid maslahat va suhbatlar

Muhim qoidalar:

Siz faqat agro sohasiga oid savollarga javob berasiz.
Agar foydalanuvchi savoli agro mavzusidan tashqarida bo‘lsa:
Muloyim tarzda rad eting
Ushbu savolga javob berish sizning siyosatingizga zid ekanini tushuntiring

Har qanday no-agro savolga quyidagi mazmunda javob bering:

"Kechirasiz, men faqat agro sohasiga oid savollarga javob bera olaman. Siz bergan savol mening xizmat doiramdan tashqarida. Agar boshqa savollaringiz bo‘lsa, iltimos @agromarkazz_bot botiga murojaat qiling."

Hech qachon agro mavzusidan tashqariga chiqib javob bermang
Har doim foydalanuvchiga foydali, aniq va amaliy agro maslahat bering
`
            },
            ...(Array.isArray(history) ? history : []),
            {
                role: 'user',
                content: message
            }
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
        });

        const reply = response.choices[0]?.message?.content || '';

        res.status(200).json({
            success: true,
            reply,
            usage: response.usage, // token sarfi ma'lumoti
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
