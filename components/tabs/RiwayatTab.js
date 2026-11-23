'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Trash2,
  Layers,
  UtensilsCrossed,
  Car,
  GraduationCap,
  Gamepad2,
  Coins,
  Receipt
} from 'lucide-react';
import TransactionCard from '../TransactionCard';

const CATEGORY_CHIPS = [
  { name: 'Semua', icon: Layers },
  { name: 'Makanan & Minuman', icon: UtensilsCrossed },
  { name: 'Transportasi', icon: Car },
  { name: 'Kuliah', icon: GraduationCap },
  { name: 'Hiburan', icon: Gamepad2 },
  { name: 'Umum', icon: Coins },
];

export default function RiwayatTab({ transactions = [], onResetData, onDeleteTransaction }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Filter transaksi berdasarkan kategori chip yang dipilih
  const filteredTransactions = transactions.filter((item) => {
    if (selectedCategory === 'Semua') return true;
    const cat = item.category || '';
    if (selectedCategory === 'Makanan & Minuman') {
      return cat.includes('Makanan') || cat.includes('Minuman') || cat.includes('Kopi');
    }
    return cat.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Fungsi penentuan label grup tanggal (Hari ini / Kemarin / Tanggal Spesifik)
  const getGroupLabel = (dateString) => {
    if (!dateString) return 'Lainnya';
    const txDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = txDate.toDateString() === today.toDateString();
    const isYesterday = txDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Hari ini';
    if (isYesterday) return 'Kemarin';

    return txDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Mengelompokkan data transaksi berdasarkan label grup
  const groupedTransactions = filteredTransactions.reduce((acc, item) => {
    const label = getGroupLabel(item.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  const groupKeys = Object.keys(groupedTransactions);

  return (
    <motion.div key="riwayat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      
      {/* Header & Reset Data */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-neutral-800" />
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        </div>
        <button
          onClick={onResetData}
          className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>
      </div>

      {/* Filter Kategori Chips dengan Icon */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_CHIPS.map((chip) => {
          const ChipIcon = chip.icon;
          const isActive = selectedCategory === chip.name;
          return (
            <button
              key={chip.name}
              onClick={() => setSelectedCategory(chip.name)}
              className={`text-xs px-3.5 py-2 rounded-full font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChipIcon className="w-3.5 h-3.5" />
              <span>{chip.name}</span>
            </button>
          );
        })}
      </div>

      {/* Daftar Transaksi terkelompok berdasarkan Tanggal */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-2">
          <Receipt className="w-10 h-10 text-gray-300" />
          <p>Tidak ada transaksi ditemukan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupKeys.map((groupLabel) => (
            <div key={groupLabel} className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{groupLabel}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedTransactions[groupLabel].map((item) => (
                  <TransactionCard key={item.id} transaction={item} onDelete={onDeleteTransaction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
