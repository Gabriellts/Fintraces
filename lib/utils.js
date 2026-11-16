import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility helper untuk Tailwind CSS class merging
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format angka ke format mata uang Rupiah
export function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Batas anggaran bulanan per kategori
export const BUDGET_LIMITS = {
  'Makanan & Minuman': 700000,
  'Transportasi': 200000,
  'Kuliah': 300000,
  'Hiburan': 150000,
  'Belanja': 300000,
  'Tagihan': 500000,
  'Umum': 300000,
};

// Normalisasi variasi nama kategori dari AI/User ke kategori standar
export const getStandardCategory = (cat) => {
  if (!cat) return 'Umum';
  const c = String(cat).toLowerCase().trim();
  if (c.includes('makan') || c.includes('minum') || c.includes('kopi')) return 'Makanan & Minuman';
  if (c.includes('transport')) return 'Transportasi';
  if (c.includes('kuliah') || c.includes('buku') || c.includes('foto')) return 'Kuliah';
  if (c.includes('hibur') || c.includes('game') || c.includes('nonton')) return 'Hiburan';
  if (c.includes('belanja') || c.includes('shop')) return 'Belanja';
  if (c.includes('tagihan') || c.includes('kos') || c.includes('listrik')) return 'Tagihan';
  return 'Umum';
};

// Validasi ID Telegram (angka yang didapat dari @userinfobot).
// ID pengguna Telegram selalu bilangan bulat positif tanpa awalan 0.
// Batas 5-15 digit: cukup untuk akun lama maupun baru, dan masih aman sebagai Number di JS.
export const validateTelegramId = (value) => {
  const id = String(value ?? '').trim();

  if (!id) return { valid: false, error: 'ID Telegram wajib diisi.' };
  if (!/^\d+$/.test(id)) return { valid: false, error: 'ID Telegram hanya boleh berisi angka (tanpa spasi, huruf, atau simbol).' };
  if (id.startsWith('0')) return { valid: false, error: 'ID Telegram tidak boleh diawali angka 0.' };
  if (id.length < 5) return { valid: false, error: 'ID Telegram terlalu pendek (minimal 5 digit).' };
  if (id.length > 15) return { valid: false, error: 'ID Telegram terlalu panjang (maksimal 15 digit).' };

  return { valid: true, id };
};
