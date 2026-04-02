const OpenAI = require('openai');

// @desc    Get AI crop planting recommendations
// @route   POST /api/aiplan
// @access  Private
exports.getAIPlan = async (req, res) => {
    try {
        const { hudud, yer_hajmi, tuproq_turi, suv_mavjudligi, oldingi_hosil, urug_turi, qoshimcha_malumot } = req.body;

        // Validatsiya
        if (!hudud || !yer_hajmi || !tuproq_turi || !suv_mavjudligi) {
            return res.status(400).json({
                success: false,
                message: 'Barcha maydonlar to\'ldirilishi kerak: hudud, yer_hajmi, tuproq_turi, suv_mavjudligi'
            });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return res.status(500).json({ success: false, message: 'OPENAI_API_KEY topilmadi' });
        }

        const openai = new OpenAI({ apiKey: openaiKey });

        const systemPrompt = `You are an expert agronomist and agricultural economist specialized in Uzbekistan and Central Asia.

The user will give you the following field parameters:
- hudud (region)
- yer_hajmi (hectares)
- tuproq_turi (soil type)
- suv_mavjudligi (water availability)
- oldingi_hosil (previous crop)
- urug_navi (seed variety information, agar berilgan bo‘lsa)
- qoshimcha_malumotlar (additional information)

Your ONLY task is to analyze ALL these parameters and user-provided data 100% thoroughly. Crop rotation tamoyillarini, oldingi hosildan keyin yerni qolgan kuchini (soil strength after previous harvest), urug‘ navining mosligini, suv kamayishi xavfini (suv_mavjudligi asosida), qo‘shimcha ma’lumotlarni va joriy O‘zbekiston bozor sharoitlarini (2025–2026 narxlar, iqlim, tuproq va suv ma’lumotlari, o‘tgan yillarning real statistikasi) hisobga olgan holda eng mos ekinlarni tanlang.

You MUST respond with a valid JSON array ONLY. Do not write any explanation, greeting, introduction, or any text outside the JSON. No markdown, no code block, just pure JSON.

Return 5 to 12 most suitable crops (ma’lumotlar asosida iloji boricha ko‘proq yuqori darajadagi foydali va real variantlarni bering, sorted from highest suitability to lowest).

Each crop object must follow this exact structure:

{
  "ekin_nomi": "string",
  "moslik_darajasi": "yuqori" | "o'rtacha" | "past",
  "tavsif": "Qisqa va aniq tavsif (1-2 jumla, o‘zbek tilida) – barcha parametrlar va qo‘shimcha ma’lumotlarni hisobga olgan holda",
  "xarajat": {
    "umumiy_so'm_1_gektar": number,
    "tavsif": "Asosiy xarajatlar taqsimoti (urug‘, o‘g‘it, yoqilg‘i, ish haqi va boshqalar, 2025-2026 bozor narxlari asosida) - o‘zbek tilida"
  },
  "mehnat_xarajati": {
    "ish_kunlari_1_gektar": number,
    "tavsif": "Mehnat talabi haqida qisqa izoh - o‘zbek tilida"
  },
  "suv_talabi": {
    "m3_gektar_yil": number,
    "tavsif": "Suv sarfi haqida qisqa izoh - o‘zbek tilida, suv_mavjudligi va kamayish xavfini hisobga olgan holda"
  },
  "prognoz_hosil": "string (masalan: '45-60 tonna/gektar, o‘tgan yillar statistikasiga asosan')",
  "hosildorlik_tahlili": {
    "ortacha_hosil_tonna_gektar": number,
    "tahlil": "Tahminiy hosildan hosildorlikning batafsil tahlili: asosiy omillar (tuproq, suv, iqlim, oldingi hosil ta’siri), xavf-xatarlar (shu jumladan suv kamayishi), hosildorlikni oshirish choralari - o‘zbek tilida, o‘tgan yilgi real ma’lumotlar asosida aniqroq"
  },
  "taxminiy_foyda_so'm_gektar": number,
  "eslatmalar": "Muhim maslahatlar, xavf-xatarlar, optimal ekish vaqti, suv tejash usullari va boshqa amaliy tavsiyalar - o‘zbek tilida, barcha user ma’lumotlarini hisobga olgan holda",
  "oldin_hosil_tahlili": {
    "oldin_hosil": "string (foydalanuvchi bergan oldingi hosil nomi)",
    "moslik_darajasi": "yuqori" | "o'rtacha" | "past",
    "tahlil": "Yerning qolgan kuchi va ekin almashinuviga mosligi haqida batafsil tahlil (o‘zbek tilida)"
  },
  "tavsiya_etilgan_urug_navi": {
    "nav_nomi": "string (aniq tavsiya etilgan nav nomi)",
    "moslik_tahlili": "Bu navning tuproq_turi, suv_mavjudligi, hudud va boshqa shartlarga mosligi haqida qisqa tahlil (o‘zbek tilida)"
  },
  "suv_xavfi_va_choralar": "Suv kamayib qolishi xavfi darajasi va oldini olish choralari haqida aniq tavsiya (o‘zbek tilida, suv_mavjudligi va qo‘shimcha ma’lumotlarga asosan)"
}

All monetary values must be in Uzbek Som (so‘m) and based on current real market prices in Uzbekistan (2025–2026). Forecasts and yield analysis must be highly realistic, practical and data-backed for the given soil, water, region, previous crop and all user information. Use the latest available agricultural statistics, historical yield data and market trends for maximum accuracy.

Output format example:
[
  {first crop object},
  {second crop object},
  ...
]

Never break this rule. Always return only the JSON array.
`;

        const userPrompt = `
Hudud: ${hudud}
Yer hajmi: ${yer_hajmi}
Tuproq turi: ${tuproq_turi}
Suv mavjudligi: ${suv_mavjudligi}
${oldingi_hosil ? `Oldingi hosil: ${oldingi_hosil}\n` : ''}${urug_turi ? `Urug' turi: ${urug_turi}\n` : ''}${qoshimcha_malumot ? `Qo'shimcha ma'lumot: ${qoshimcha_malumot}\n` : ''}
`.trim();
        const response = await openai.chat.completions.create({
            model: 'gpt-5.1',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            temperature: 0.4,
            max_completion_tokens: 128000,
        });

        const rawContent = response.choices[0]?.message?.content?.trim() || '[]';

        // JSON massivini parse qilish
        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch {
            return res.status(500).json({
                success: false,
                message: 'AI dan noto\'g\'ri JSON keldi, qayta urinib ko\'ring',
                raw: rawContent
            });
        }

        // Massiv ekanligini tekshirish
        if (!Array.isArray(parsed)) {
            return res.status(500).json({
                success: false,
                message: 'AI kutilgan formatda javob bermadi',
                raw: parsed
            });
        }

        res.status(200).json({
            success: true,
            input: { hudud, yer_hajmi, tuproq_turi, suv_mavjudligi, oldingi_hosil, urug_turi, qoshimcha_malumot },
            recommendations: parsed
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
