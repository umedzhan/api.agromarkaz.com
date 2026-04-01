const OpenAI = require('openai');

// @desc    Get AI crop planting recommendations
// @route   POST /api/aiplan
// @access  Private
exports.getAIPlan = async (req, res) => {
    try {
        const { hudud, yer_hajmi, tuproq_turi, suv_mavjudligi } = req.body;

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

Your ONLY task is to analyze these parameters and return the MOST suitable crops for that specific field with highly realistic forecasts based on current Uzbekistan market conditions (2025–2026 prices, climate, soil and water data).

You MUST respond with a valid JSON array ONLY. Do not write any explanation, greeting, introduction, or any text outside the JSON. No markdown, no code block, just pure JSON.

Return 5 to 8 most suitable crops, sorted from highest suitability to lowest.

Each crop object must follow this exact structure:

{
  "ekin_nomi": "string",
  "moslik_darajasi": "yuqori" | "o'rtacha" | "past",
  "tavsif": "Qisqa va aniq tavsif (1-2 jumla, o'zbek tilida)",
  "xarajat": {
    "umumiy_so'm_1_gektar": number,
    "tavsif": "Asosiy xarajatlar taqsimoti (urug', o'g'it, yoqilg'i, ish haqi va boshqalar) - o'zbek tilida"
  },
  "mehnat_xarajati": {
    "ish_kunlari_1_gektar": number,
    "tavsif": "Mehnat talabi haqida qisqa izoh - o'zbek tilida"
  },
  "suv_talabi": {
    "m3_gektar_yil": number,
    "tavsif": "Suv sarfi haqida qisqa izoh - o'zbek tilida"
  },
  "prognoz_hosil": "string (masalan: '45-60 tonna/gektar')",
  "taxminiy_foyda_so'm_gektar": number,
  "eslatmalar": "Muhim maslahatlar, xavf-xatarlar, optimal ekish vaqti va boshqa amaliy tavsiyalar - o'zbek tilida"
}

All monetary values must be in Uzbek Som (so'm) and based on current real market prices in Uzbekistan. Forecasts must be realistic and practical for the given soil, water and region.

Output format example:
[
  {first crop object},
  {second crop object},
  ...
]

Never break this rule. Always return only the JSON array.`;

        const userPrompt = `Hudud: ${hudud}
Yer hajmi: ${yer_hajmi}
Tuproq turi: ${tuproq_turi}
Suv mavjudligi: ${suv_mavjudligi}`;

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
            max_completion_tokens: 100000,
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
            input: { hudud, yer_hajmi, tuproq_turi, suv_mavjudligi },
            recommendations: parsed
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
