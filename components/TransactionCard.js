'use client';

import {
  UtensilsCrossed,
  Car,
  GraduationCap,
  Receipt,
  ShoppingBag,
  Gamepad2,
  Coins,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStandardCategory } from '@/lib/utils';

const CATEGORY_CONFIG = {
  'Makanan & Minuman': {
    icon: UtensilsCrossed,
    bg: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  'Transportasi': {
    icon: Car,
    bg: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  'Kuliah': {
    icon: GraduationCap,
    bg: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  'Tagihan': {
    icon: Receipt,
    bg: 'bg-red-50 text-red-600 border-red-200',
  },
  'Belanja': {
    icon: ShoppingBag,
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  'Hiburan': {
    icon: Gamepad2,
    bg: 'bg-pink-50 text-pink-600 border-pink-200',
  },
  'Umum': {
    icon: Coins,
    bg: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

export default function TransactionCard({ transaction, onDelete }) {
  const stdCat = getStandardCategory(transaction.category);
  const config = CATEGORY_CONFIG[stdCat] || CATEGORY_CONFIG['Umum'];
  const Icon = config.icon;

  return (
    <Card className="overflow-hidden hover:bg-slate-50 transition-colors border border-gray-200/80 shadow-sm">
      <CardContent className="p-3.5 flex items-center justify-between gap-3">
        {/* Ikon Kategori Visual */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bg}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Bagian Tengah: Judul dan Kategori */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-800 truncate" title={transaction.title}>
            {transaction.title}
          </p>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="w-fit text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 border-slate-200 font-normal">
              {transaction.category || 'Umum'}
            </Badge>
          </div>
        </div>
        
        {/* Bagian Kanan: Nominal & Tombol Hapus */}
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-sm font-bold text-red-500 max-w-[120px] sm:max-w-[180px] truncate" title={`Rp${Number(transaction.price || 0).toLocaleString('id-ID')}`}>
            - Rp{Number(transaction.price || 0).toLocaleString('id-ID')}
          </p>
          {onDelete && (
            <button 
              onClick={() => onDelete(transaction.id)}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Hapus transaksi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
