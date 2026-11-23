export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Handler Notifikasi Pengingat Otomatis FinTraces
 * Mengirimkan pesan Telegram (notifikasi push di HP) ke pengguna yang
 * tidak mencatat transaksi keuangan dalam 24 jam terakhir.
 */
async function sendDailyReminders(request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN belum disetel di environment variables.'
    }, { status: 500 });
  }

  try {
    // 1. Ambil semua pengguna dari tabel user_settings & transactions
    const { data: userSettings, error: userError } = await supabase
      .from('user_settings')
      .select('telegram_id, first_name');

    if (userError) {
      console.error('Error fetching user_settings:', userError);
    }

    const { data: txUsers, error: txError } = await supabase
      .from('transactions')
      .select('telegram_id');

    if (txError) {
      console.error('Error fetching tx users:', txError);
    }

    // Kumpulkan seluruh telegram_id yang unik
    const userMap = new Map();

    (userSettings || []).forEach((u) => {
      if (u.telegram_id) {
        userMap.set(String(u.telegram_id), u.first_name || 'Teman');
      }
    });

    (txUsers || []).forEach((t) => {
      if (t.telegram_id && !userMap.has(String(t.telegram_id))) {
        userMap.set(String(t.telegram_id), 'Teman');
      }
    });

    const uniqueUsers = Array.from(userMap.entries());

    if (uniqueUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada pengguna terdaftar untuk dikirimi pengingat.',
        totalUsers: 0,
        remindedUsers: 0
      });
    }

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const results = [];

    // 2. Periksa aktivitas transaksi setiap pengguna
    for (const [telegramId, firstName] of uniqueUsers) {
      // Ambil transaksi paling baru
      const { data: latestTxs } = await supabase
        .from('transactions')
        .select('created_at, title')
        .eq('telegram_id', telegramId)
        .order('created_at', { ascending: false })
        .limit(1);

      const latestTx = latestTxs && latestTxs.length > 0 ? latestTxs[0] : null;
      let shouldRemind = false;
      let hoursSinceLastTx = null;

      if (!latestTx) {
        // Belum pernah mencatat sama sekali
        shouldRemind = true;
      } else {
        const txTime = new Date(latestTx.created_at).getTime();
        const diffMs = now - txTime;
        hoursSinceLastTx = Math.round(diffMs / (1000 * 60 * 60));
        if (diffMs >= ONE_DAY_MS) {
          shouldRemind = true;
        }
      }

      if (shouldRemind) {
        const reminderText = 
          `🔔 *Pengingat FinTraces* 🔔\n\n` +
          `Halo *${firstName}*! 👋\n` +
          `Hari ini kamu belum mencatat pengeluaran keuanganmu nih.\n\n` +
          `Yuk luangkan 10 detik untuk mencatat pengeluaranmu sebelum lupa:\n` +
          `• Ketik contoh: *"Makan siang 15rb"*\n` +
          `• Atau kirim *Voice Note* langsung! 🎙️\n\n` +
          `💡 _Ketik /saldo untuk memantau sisa uang sakumu._`;

        try {
          const telegramRes = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: telegramId,
                text: reminderText,
                parse_mode: 'Markdown'
              })
            }
          );

          const resData = await telegramRes.json();
          results.push({
            telegram_id: telegramId,
            sent: resData.ok,
            hoursSinceLastTx,
            error: resData.ok ? null : resData.description
          });
        } catch (sendErr) {
          results.push({
            telegram_id: telegramId,
            sent: false,
            error: sendErr.message
          });
        }
      } else {
        results.push({
          telegram_id: telegramId,
          sent: false,
          skipped: true,
          hoursSinceLastTx,
          reason: 'Pengguna sudah mencatat transaksi dalam 24 jam terakhir.'
        });
      }
    }

    const sentCount = results.filter((r) => r.sent).length;

    return NextResponse.json({
      success: true,
      message: `Pengecekan pengingat selesai. ${sentCount} notifikasi terkirim.`,
      timestamp: new Date().toISOString(),
      totalUsers: uniqueUsers.length,
      remindedUsers: sentCount,
      details: results
    });

  } catch (err) {
    console.error('Error in sendDailyReminders:', err);
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  return sendDailyReminders(request);
}

export async function POST(request) {
  return sendDailyReminders(request);
}
