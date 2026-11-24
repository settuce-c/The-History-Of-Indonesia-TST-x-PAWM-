'use strict';
const { z } = require('zod');
const { AppError } = require('../shared/errors');

/** Skema yang dikirim ke Gemini (structured output) agar jawabannya sudah berbentuk JSON yang kita mau. */
const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      question: { type: 'STRING' },
      options: { type: 'ARRAY', items: { type: 'STRING' } },
      answerIndex: { type: 'INTEGER' },
      explanation: { type: 'STRING' },
    },
    required: ['question', 'options', 'answerIndex', 'explanation'],
  },
};

/**
 * Validasi KITA SENDIRI atas keluaran model. Jangan percaya begitu saja: model bisa salah
 * jumlah opsi, indeks jawaban di luar rentang, atau opsi kembar.
 */
const aiQuestionSchema = z
  .object({
    question: z.string().trim().min(10).max(500),
    options: z.array(z.string().trim().min(1).max(300)).length(4, 'Harus tepat 4 opsi'),
    answerIndex: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(5).max(1000),
  })
  .refine((d) => new Set(d.options.map((o) => o.toLowerCase())).size === d.options.length, {
    message: 'Opsi tidak boleh kembar',
    path: ['options'],
  });

const norm = (t) => t.toLowerCase().replace(/\s+/g, ' ').trim();

/** Acak urutan opsi (Fisher-Yates) agar kunci jawaban tidak condong ke posisi tertentu. */
function shuffleOptions(item, rand = Math.random) {
  const order = item.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...item,
    options: order.map((i) => item.options[i]),
    answerIndex: order.indexOf(item.answerIndex),
  };
}

function buildPrompt({ chapter, count, existing }) {
  return [
    'Kamu adalah penulis soal sejarah Indonesia untuk aplikasi belajar umum (pengguna: orang yang penasaran dengan sejarah).',
    `Buat tepat ${count} soal pilihan ganda dalam bahasa Indonesia berdasarkan HANYA materi di bawah ini.`,
    'Aturan:',
    '- Jangan menambahkan fakta, nama, atau tahun yang tidak ada di materi.',
    '- Tiap soal punya tepat 4 opsi; hanya 1 yang benar; opsi salah harus masuk akal tetapi jelas salah menurut materi.',
    '- answerIndex adalah indeks (mulai 0) opsi yang benar.',
    '- explanation: pembahasan singkat 1-2 kalimat mengapa jawaban itu benar.',
    '- Jangan menulis frasa seperti "berdasarkan teks" atau "menurut materi".',
    existing.length ? `- Jangan mengulang soal berikut:\n${existing.map((t) => `  * ${t}`).join('\n')}` : '',
    '',
    `Judul bab: ${chapter.title}`,
    'Materi:',
    chapter.summary,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

/**
 * Generator kuis AI. Alur: minta ke Gemini -> validasi skema -> buang yang tidak valid/duplikat ->
 * simpan sebagai DRAF (source='ai', status='draft'). Soal draf baru dipakai setelah admin menyetujui.
 */
function createAiQuizService({ gemini, assessment }) {
  async function generate(chapter, count) {
    const existing = assessment.questionTexts(chapter.id);
    const raw = await gemini.generateJson({
      prompt: buildPrompt({ chapter, count, existing: existing.slice(-20) }),
      schema: RESPONSE_SCHEMA,
    });

    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : null;
    if (!list) throw new AppError(502, 'AI_INVALID_RESPONSE', 'Format jawaban Gemini tidak sesuai (bukan daftar soal).');

    const seen = new Set(existing.map(norm));
    const valid = [];
    const rejected = [];
    list.slice(0, count).forEach((item, i) => {
      const parsed = aiQuestionSchema.safeParse(item);
      if (!parsed.success) {
        rejected.push({ index: i, reason: parsed.error.issues.map((x) => x.message).join('; ') });
      } else if (seen.has(norm(parsed.data.question))) {
        rejected.push({ index: i, reason: 'Duplikat dengan soal yang sudah ada' });
      } else {
        seen.add(norm(parsed.data.question));
        valid.push(shuffleOptions(parsed.data));
      }
    });

    if (valid.length === 0) {
      throw new AppError(
        502,
        'AI_INVALID_RESPONSE',
        'Tidak ada soal valid dari Gemini (skema/jumlah opsi/indeks jawaban salah atau duplikat). Coba lagi.'
      );
    }
    const created = assessment.createDrafts(chapter.id, valid);
    return { chapterId: chapter.id, requested: count, created, rejected };
  }

  return { generate };
}

module.exports = { createAiQuizService, aiQuestionSchema, shuffleOptions, RESPONSE_SCHEMA };
