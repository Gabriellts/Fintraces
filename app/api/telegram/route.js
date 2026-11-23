export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { ekstrakDataKeuangan, transkripVoiceNote } from '../../../lib/groq';
import { getStandardCategory } from '../../../lib/utils';
import fs from 'fs';
import path from 'path';
import os from 'os';

const getDynamicBudgetLimits = (saldo) => {
  const base = saldo > 0 ? saldo : 1500000;
  return {
    'Makanan & Minuman': base * 0.40,
    'Transportasi': base * 0.15,
    'Kuliah': base * 0.15,
    'Tagihan': base * 0.10,
    'Belanja': base * 0.10,
    'Hiburan': base * 0.05,
    'Umum': base * 0.05,
  };
};

// Helper kirim pesan dengan fallback jika Markdown gagal diparsing Telegram
async function sendTelegramMessage(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN belum diatur di Environment Variables!');
    return;
  }

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });

  if (!res.ok) {
    // Kirim ulang tanpa Markdown jika ada karakter simbol/underscore yang bentrok
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.replace(/[*_`]/g, ''),
      }),
    });
  }
}

// Endpoint GET untuk mengecek apakah route API aktif di browser
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'FinTraces Telegram Webhook',
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    { status: 200 }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.message || (!body.message.text && !body.message.voice)) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const chatId = body.message.chat.id;
    const userId = String(chatId);
    const firstName = body.message.from?.first_name || 'Teman';
    let userText = '';
    let replyMessage = '';

    // Ambil atau inisialisasi pengaturan pengguna (saldo awal)
    let userSaldoAwal = 1500000;
    try {
      const { data: existingUser } = await supabase
        .from('user_settings')
        .select('saldo_awal')
        .eq('telegram_id', userId)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.saldo_awal !== null && existingUser.saldo_awal !== undefined) {
          userSaldoAwal = Number(existingUser.saldo_awal);
        }
      } else {
        await supabase.from('user_settings').insert([
          {
            telegram_id: userId,
            saldo_awal: 1500000,
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (userDbErr) {
      console.warn('Catatan user_settings:', userDbErr.message);
    }

    try {
      // 1. PROSES AUDIO (VOICE NOTE)
      if (body.message.voice) {
        const fileId = body.message.voice.file_id;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
        const fileRes = await fetch(getFileUrl);
        const fileData = await fileRes.json();

        if (!fileData.ok) throw new Error('Gagal mengambil info file suara dari Telegram');
        const filePathTelegram = fileData.result.file_path;

        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePathTelegram}`;
        const audioRes = await fetch(downloadUrl);
        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const tempFilePath = path.join(os.tmpdir(), `${fileId}.ogg`);
        fs.writeFileSync(tempFilePath, buffer);

        userText = await transkripVoiceNote(tempFilePath);

        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        if (!userText) {
          throw new Error('Suara tidak terdengar jelas oleh AI.');
        }
      } else if (body.message.text) {
        userText = body.message.text.trim();
      }

      // 2. CEK PERINTAH MENU
      if (userText.startsWith('/start') || userText.startsWith('/bantuan')) {
        replyMessage =
          `🤖 *Selamat Datang di FinTraces Bot!*\n\n` +
          `Halo *${firstName}*! Saya asisten pencatat keuangan pribadi kamu.\n` +
          `Cukup ketik atau kirim *Voice Note* pengeluaranmu, contoh:\n` +
          `• "Makan siang 15 ribu"\n` +
          `• "Beli bensin 20rb"\n` +
          `• "Bayar kos 500rb kemarin"\n\n` +
          `*Daftar Perintah Bot:*\n` +
          `/saldo - Cek sisa saldo & total pengeluaran\n` +
          `/riwayat - Lihat 5 transaksi terakhir\n` +
          `/budget - Cek status batas anggaran tiap kategori\n` +
          `/insight - Tips & analisis pengeluaran AI\n` +
          `/ingatkan - Uji notifikasi pengingat harian di HP\n` +
          `/bantuan - Cara mencatat transaksi`;
      } else if (userText.startsWith('/saldo')) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('price')
          .eq('telegram_id', userId);

        const totalKeluar = (txs || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
        const sisaSaldo = userSaldoAwal - totalKeluar;

        replyMessage =
          `💰 *Ringkasan Saldo FinTraces*\n\n` +
          `📥 Saldo Awal / Uang Kiriman: Rp${userSaldoAwal.toLocaleString('id-ID')}\n` +
          `📤 Total Pengeluaran: Rp${totalKeluar.toLocaleString('id-ID')}\n` +
          `💎 *Sisa Saldo:* Rp${sisaSaldo.toLocaleString('id-ID')}\n\n` +
          `_(Batas saldo awal dapat disesuaikan di Web Dashboard)_`;
      } else if (userText.startsWith('/riwayat')) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('telegram_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!txs || txs.length === 0) {
          replyMessage = `📄 Belum ada catatan transaksi yang tersimpan.\n\nYuk catat transaksi pertamamu, contoh: "Makan siang 15rb"`;
        } else {
          replyMessage = `📄 *5 Transaksi Terakhir Kamu:*\n\n`;
          txs.forEach((item, index) => {
            replyMessage += `${index + 1}. *${item.title}* (${item.category || 'Umum'})\n   - Rp${Number(item.price).toLocaleString('id-ID')}\n\n`;
          });
        }
      } else if (userText.startsWith('/budget')) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('category, price')
          .eq('telegram_id', userId);

        const stats = {};
        (txs || []).forEach((item) => {
          const stdCat = getStandardCategory(item.category);
          stats[stdCat] = (stats[stdCat] || 0) + Number(item.price || 0);
        });

        const dynamicLimits = getDynamicBudgetLimits(userSaldoAwal);

        replyMessage = `📊 *Status Anggaran Bulanan (Budget):*\n\n`;
        for (const [cat, limit] of Object.entries(dynamicLimits)) {
          const spent = stats[cat] || 0;
          const roundedLimit = Math.round(limit);
          const percent = roundedLimit > 0 ? Math.round((spent / roundedLimit) * 100) : 0;
          const statusIcon = percent >= 100 ? '🚨' : percent >= 80 ? '⚠️' : '✅';
          replyMessage += `${statusIcon} *${cat}*\n   Rp${spent.toLocaleString('id-ID')} / Rp${roundedLimit.toLocaleString('id-ID')} (${percent}%)\n\n`;
        }
      } else if (userText.startsWith('/insight')) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('price, category')
          .eq('telegram_id', userId);

        const totalKeluar = (txs || []).reduce((sum, item) => sum + Number(item.price || 0), 0);

        let topCategory = 'Belum ada';
        let maxVal = 0;
        const catMap = {};
        (txs || []).forEach((i) => {
          const stdCat = getStandardCategory(i.category);
          catMap[stdCat] = (catMap[stdCat] || 0) + Number(i.price || 0);
          if (catMap[stdCat] > maxVal) {
            maxVal = catMap[stdCat];
            topCategory = stdCat;
          }
        });

        replyMessage =
          `💡 *Analisis & Insight FinTraces AI:*\n\n` +
          `• Total Pengeluaran: Rp${totalKeluar.toLocaleString('id-ID')}\n` +
          `• Pengeluaran Terbesar: *${topCategory}* (Rp${maxVal.toLocaleString('id-ID')})\n\n` +
          `_Tips: Pantau kategori terbesarmu agar uang sakumu tetap aman dan cukup hingga akhir bulan!_`;
      } else if (userText.startsWith('/ingatkan') || userText.startsWith('/testnotif')) {
        replyMessage =
          `🔔 *[Tes Notifikasi Pengingat]* 🔔\n\n` +
          `Halo *${firstName}*! 👋\n` +
          `Notifikasi pengingat berhasil dikirim ke perangkatmu.\n\n` +
          `FinTraces akan otomatis mengirimkan pesan pengingat seperti ini jika kamu belum mencatat pengeluaran selama 24 jam.\n\n` +
          `✨ Coba catat pengeluaranmu sekarang, contoh: *"Makan siang 15rb"*.`;
      } else {
        // 3. PROSES PENGELUARAN VIA GROQ AI
        const dataKeuangan = await ekstrakDataKeuangan(userText);

        if (dataKeuangan.error) {
          replyMessage = `⚠️ *Format Belum Dikenali*\n${dataKeuangan.error}\n\nKetik /bantuan untuk melihat panduan atau contoh pesan.`;
        } else {
          const normalizedCategory = getStandardCategory(dataKeuangan.category);

          const { error: dbError } = await supabase.from('transactions').insert([
            {
              telegram_id: userId,
              title: dataKeuangan.title,
              price: dataKeuangan.price,
              category: normalizedCategory,
            },
          ]);

          if (dbError) throw dbError;

          const { data: catTransactions } = await supabase
            .from('transactions')
            .select('price, category')
            .eq('telegram_id', userId);

          let totalTerpakaiKategori = 0;
          (catTransactions || []).forEach((t) => {
            if (getStandardCategory(t.category) === normalizedCategory) {
              totalTerpakaiKategori += Number(t.price || 0);
            }
          });

          const dynamicLimits = getDynamicBudgetLimits(userSaldoAwal);
          const limitKategori = dynamicLimits[normalizedCategory] || 500000;
          const persentase = Math.round((totalTerpakaiKategori / limitKategori) * 100);

          replyMessage =
            `✅ *Pengeluaran Berhasil Dicatat!*\n\n` +
            `📌 Judul: *${dataKeuangan.title}*\n` +
            `💰 Nominal: *Rp${dataKeuangan.price.toLocaleString('id-ID')}*\n` +
            `📂 Kategori: *${normalizedCategory}*`;

          if (persentase >= 100) {
            replyMessage += `\n\n🚨 *Peringatan Defisit:* Anggaran *${normalizedCategory}* sudah melampaui batas (*${persentase}%*)!`;
          } else if (persentase >= 80) {
            replyMessage += `\n\n⚠️ *Perhatian:* Anggaran *${normalizedCategory}* sudah terpakai *${persentase}%*.`;
          }
        }
      }
    } catch (prosesError) {
      console.error('❌ ERROR PROSES AI/DB:', prosesError);
      replyMessage = `⚠️ *Terjadi Kendala Sistem*\n${prosesError.message || 'Silakan coba lagi.'}`;
    }

    await sendTelegramMessage(chatId, replyMessage);
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (globalError) {
    console.error('❌ ERROR GLOBAL WEBHOOK:', globalError);
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}