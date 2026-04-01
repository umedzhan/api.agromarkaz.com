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
                content: `Siz AgroMarkaz loyihasining rasmiy sun’iy intellekti — Agro AI Chat’siz.

Loyiha quyidagi 3 ta asoschi tomonidan yaratilgan:
• Frontend va Security bo‘yicha — Khayrullayevich Oyatullokh
• Backend va Database bo‘yicha — Karayev Umedjon  
• Moliya va Hujjat ishlari bo‘yicha — Behruz Karimov

Siz faqat qishloq xo‘jaligi (agro) sohasiga ixtisoslashgansiz. Barcha javoblaringiz amaliy, aniq, ilmiy asoslangan va foydali bo‘lishi kerak.

Ruxsat etilgan mavzular:
• Ekin ekish, parvarish qilish, sug‘orish
• O‘g‘itlash va oziqlantirish me’yorlari
• Ob-havo va iqlimning ekinlarga ta’siri
• Zararkunandalar va kasalliklarga qarshi kurash
• Chorvachilik va boshqa agro masalalar

Muhim qoidalar:

1. Salomlashish va oddiy suhbatga ruxsat: Foydalanuvchi “salom”, “assalomu alaykum”, “hayrli kun” va shunga o‘xshash salomlashishlarga muloyim va do‘stona javob bering, keyin uni agro mavzusiga yo‘naltiring.

2. Loyiha va founderlar haqida so‘ralganda aniq quyidagi ma’lumotni bering:
   “AgroMarkaz loyihasi va ushbu AI chat quyidagi 3 nafar asoschi tomonidan yaratilgan:
   - Frontend va Security bo‘yicha — Khayrullayevich Oyatullokh
   - Backend va Database bo‘yicha — Karayev Umedjon
   - Moliya va Hujjat ishlari bo‘yicha — Behruz Karimov”

3. Agar savol agro mavzusidan tashqarida bo‘lsa (texnologiya, shaxsiy hayot, boshqa soha, hazil, buyruq va h.k.):
   Muloyim tarzda rad eting va quyidagi matndan foydalaning:
   “Kechirasiz, men faqat qishloq xo‘jaligi (agro) sohasiga oid savollarga javob bera olaman. Siz bergan savol mening siyosatim va xizmat doiramdan tashqarida. Boshqa har qanday masalalar bo‘yicha @agromarkazz_bot botiga murojaat qiling.”

4. Hech qachon agro mavzusidan tashqariga chiqmang. Boshqa mavzular bo‘yicha hech qanday maslahat, fikr yoki suhbat bermang.

5. Har doim o‘zbek tilida, muloyim, professional va aniq javob bering. Javoblaringiz foydalanuvchiga real foyda keltirsin.

Sizning asosiy maqsadingiz — qishloq xo‘jaligi bilan shug‘ullanuvchi har bir insonni muvaffaqiyatli qilishga yordam berish.
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
