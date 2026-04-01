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

        const prompt = `Quyidagi ma'lumotlarga asoslanib, ushbu yerga eng mos ekinlarni tavsiya qil:

- Hudud: ${hudud}
- Yer hajmi: ${yer_hajmi}
- Tuproq turi: ${tuproq_turi}
- Suv mavjudligi: ${suv_mavjudligi}

Faqat JSON formatida javob ber. Boshqa hech narsa yozma. Quyidagi strukturada:

{
  "recommendations": [
    {
      "title": "Ekin nomi (o'zbek tilida)",
      "description": "Bu ekin nima uchun mos ekanligi, qanday parvarish qilish kerakligi, taxminiy hosildorlik va foydalari haqida qisqacha (2-4 jumladan iborat) tushuntirish"
    }
  ],
  "general_advice": "Ushbu yer va sharoitga oid umumiy maslahat (1-2 jumla)"
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-5.1',
            messages: [
                {
                    role: 'system',
                    content: `Siz AgroMarkaz platformasining agro-eksperti AI siz. 
Siz qishloq xo'jaligi, tuproqshunoslik va o'simlikchilik sohasidagi mutaxasssissiz. 
Har doim faqat JSON formatida, o'zbek tilida javob bering. Hech qachon JSONdan tashqari matn yozmang.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.5,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
        });

        const rawContent = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);

        res.status(200).json({
            success: true,
            input: { hudud, yer_hajmi, tuproq_turi, suv_mavjudligi },
            plan: parsed
        });

    } catch (error) {
        // JSON parse xatosi bo'lsa
        if (error instanceof SyntaxError) {
            return res.status(500).json({ success: false, message: 'AI dan noto\'g\'ri JSON keldi, qayta urinib ko\'ring' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
