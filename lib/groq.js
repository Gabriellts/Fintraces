import fs from 'fs';
import Groq from 'groq-sdk';

const CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Kuliah',
  'Hiburan',
  'Belanja',
  'Tagihan',
  'Umum'
];

// ==========================================
// 1. AI EKSTRAKSI TRANSAKSI
// ==========================================
export async function ekstrakDataKeuangan(userText) {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY belum terpasang di environment variable.');
  }

  if (!userText?.trim()) {
    return { error: 'Pesan transaksi tidak boleh kosong.' };
  }

  const groq = new Groq({ apiKey });

  const prompt = `
Kamu adalah AI pencatat keuangan FinTraces.

Tugas: ekstrak SATU transaksi pengeluaran dari pesan pengguna.

Pesan pengguna:
${JSON.stringify(userText)}

Aturan:
1. Hanya proses transaksi pengeluaran.
2. Nominal harus berupa angka integer dalam Rupiah (contoh: 15000).
3. Pahami format bahasa Indonesia seperti:
  - 15 ribu / 15rb / 15k -> 15000
  - 1,5 juta / 1.5jt -> 1500000
  - goceng -> 5000, ceban -> 10000, noban -> 20000, goban -> 50000
4. Jangan mengarang nominal jika tidak disebutkan secara eksplisit.
5. Tentukan judul/deskripsi yang ringkas dan jelas (contoh: "Nasi Padang", "Bensin Motor", "Fotokopi Materi").
6. Pilih kategori HANYA dari 7 opsi standar ini:
  - Makanan & Minuman (makanan, minuman, kopi, camilan, jajan, cafe)
  - Transportasi (bensin, ojek online, gojek, grab, parkir, angkot, bus)
  - Kuliah (buku, fotokopi, alat tulis, uang kas, print tugas)
  - Tagihan (kos, listrik, wifi, pulsa, kuota, pdam)
  - Belanja (pakaian, sabun, belanja bulanan, skincare, online shop)
  - Hiburan (nonton bioskop, game, streaming, jalan-jalan)
  - Umum (kebutuhan lain yang tidak masuk kategori di atas)
7. Jika pesan tidak mengandung nominal uang yang jelas, kembalikan JSON error.

Format JSON jika berhasil:
{
  "title": "Makan siang",
  "price": 15000,
  "category": "Makanan & Minuman"
}

Format JSON jika gagal:
{
  "error": "Nominal atau deskripsi pengeluaran tidak ditemukan. Contoh: 'Makan siang 15 ribu'"
}
`;

  try {
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah parser transaksi keuangan cerdas. Selalu keluarkan JSON valid tanpa markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_completion_tokens: 300
      });
    } catch (primaryError) {
      console.warn('Fallback ke model llama-3.1-8b-instant:', primaryError?.message);
      completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah parser transaksi keuangan cerdas. Selalu keluarkan JSON valid tanpa markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_completion_tokens: 300
      });
    }

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return { error: 'AI tidak menghasilkan data transaksi.' };
    }

    const data = JSON.parse(content);

    if (data.error) {
      return { error: data.error };
    }

    // Normalisasi kategori
    let finalCategory = data.category || 'Umum';
    if (!CATEGORIES.includes(finalCategory)) {
      if (finalCategory.toLowerCase().includes('makan') || finalCategory.toLowerCase().includes('kopi')) {
        finalCategory = 'Makanan & Minuman';
      } else if (finalCategory.toLowerCase().includes('transport')) {
        finalCategory = 'Transportasi';
      } else {
        finalCategory = 'Umum';
      }
    }

    const parsedPrice = parseInt(data.price, 10);
    if (!data.title?.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      return { error: 'Data transaksi tidak valid. Pastikan ada nominal pengeluaran.' };
    }

    return {
      title: data.title.trim(),
      price: parsedPrice,
      category: finalCategory
    };

  } catch (error) {
    console.error('Groq extraction error:', error.message);
    return {
      error: 'AI sedang mengalami kendala. Silakan coba sesaat lagi.'
    };
  }
}

// ==========================================
// 2. AI TRANSKRIPSI VOICE NOTE (SERVERLESS SAFE)
// ==========================================
export async function transkripVoiceNote(fileInput) {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY belum terpasang di environment variable.');
  }

  const groq = new Groq({ apiKey });

  try {
    // Terima baik Buffer langsung maupun path file dari /tmp
    const audioBuffer = Buffer.isBuffer(fileInput)
      ? fileInput
      : fs.readFileSync(fileInput);

    // Bungkus menjadi Web File dengan ekstensi .ogg dan MIME audio/ogg agar valid di Vercel
    const audioFile = new File([audioBuffer], 'voice.ogg', {
      type: 'audio/ogg'
    });

    let transcription;
    try {
      transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
        response_format: 'json',
        language: 'id'
      });
    } catch (primaryErr) {
      console.warn('Fallback ke whisper-large-v3:', primaryErr?.message);
      const fallbackFile = new File([audioBuffer], 'voice.ogg', {
        type: 'audio/ogg'
      });
      transcription = await groq.audio.transcriptions.create({
        file: fallbackFile,
        model: 'whisper-large-v3',
        response_format: 'json',
        language: 'id'
      });
    }

    const resultText =
      typeof transcription === 'string'
        ? transcription
        : transcription?.text || '';

    return resultText.trim();

  } catch (error) {
    console.error('Voice transcription error:', error);
    throw new Error(`Gagal memproses voice note: ${error.message}`);
  }
}