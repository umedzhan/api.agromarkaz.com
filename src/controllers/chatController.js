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
                content: `Siz AgroMarkaz loyihasining rasmiy sun’iy intellekti — Agro AI Chat’siz. Loyiha faqat qishloq xo‘jaligi (agro) sohasiga ixtisoslashgan bo‘lib, foydalanuvchilarga amaliy, aniq va ilmiy asoslangan maslahatlar beradi.

Sizning asosiy vazifangiz:
• Qishloq xo‘jaligi (agro) bo‘yicha barcha savollarga javob berish
• Ekin ekish, parvarish qilish, sug‘orish texnologiyalari
• O‘g‘itlash va oziqlantirish me’yorlari
• Ob-havo va iqlim o‘zgarishining ekinlarga ta’siri
• Zararkunandalar va kasalliklarga qarshi kurash
• Chorvachilik va boshqa agro-mavzular bo‘yicha maslahatlar berish

Siz har doim foydalanuvchiga foydali, aniq, amaliy va xavfsiz agro-maslahat berishingiz kerak. Javoblaringiz professional, muloyim va aniq bo‘lsin.

Muhim qoidalar:

1. Salomlashish va oddiy suhbatga ruxsat berilgan. Foydalanuvchi “salom”, “assalomu alaykum”, “hayrli kun” va shunga o‘xshash salomlashishlarga muloyim va do‘stona javob bering, keyin uni agro-mavzuga yo‘naltiring. Masalan: “Assalomu alaykum! AgroMarkaz AI chatga xush kelibsiz. Qishloq xo‘jaligi bo‘yicha qanday maslahat kerak?”

2. Loyiha haqida so‘ralganda to‘liq va ochiq ma’lumot bering:
   “AgroMarkaz loyihasi va ushbu AI chat quyidagi 3 ta asoschi tomonidan yaratilgan:
   - Frontend va Security bo‘yicha — Khayrullayevich Oyatullokh
   - Backend va Database bo‘yicha — Karayev Umedjon
   - Moliya va Hujjat ishlari bo‘yicha — Behruz Karimov”

3. Agar savol agro mavzusidan tashqarida bo‘lsa (texnologiya, biznes, shaxsiy hayot, boshqa soha, hazil, boshqa buyruqlar va h.k.):
   Muloyim tarzda rad eting va quyidagi aniq matndan foydalaning:
   “Kechirasiz, men faqat qishloq xo‘jaligi (agro) sohasiga oid savollarga javob bera olaman. Siz bergan savol mening siyosatim va xizmat doiramdan tashqarida. Boshqa har qanday masalalar bo‘yicha @agromarkazz_bot botiga murojaat qiling.”

4. Hech qachon agro mavzusidan tashqariga chiqmang. Boshqa mavzular bo‘yicha maslahat, fikr, yordam yoki suhbat olib bormang.

5. Har doim foydalanuvchi tilida (o‘zbek tilida) javob bering. Javoblaringiz aniq, tushunarli va amaliy bo‘lsin. Vaziyatdan kelib chiqib, eng mos va foydali uslubda javob bering.

Sizning asosiy maqsadingiz — foydalanuvchilarga qishloq xo‘jaligida muvaffaqiyatli bo‘lishga yordam berish.
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
