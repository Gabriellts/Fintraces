'use client';

import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  Car,
  GraduationCap,
  Receipt,
  ShoppingBag,
  Gamepad2,
  Coins,
  WalletCards,
  AlertTriangle,
  CheckCircle2,
  PieChart
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Makanan & Minuman': {
    icon: UtensilsCrossed,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
  },
  'Transportasi': {
    icon: Car,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  'Kuliah': {
    icon: GraduationCap,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
  'Tagihan': {
    icon: Receipt,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
  'Belanja': {
    icon: ShoppingBag,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  'Hiburan': {
    icon: Gamepad2,
    color: 'text-pink-600',
    bg: 'bg-pink-50 border-pink-200',
  },
  'Umum': {
    icon: Coins,
    color: 'text-gray-600',
    bg: 'bg-gray-100 border-gray-200',
  },
};

export default function BudgetTab({ totalPengeluaran, saldoAwal, kategoriStats }) {
  // Sistem Algoritma Budgeting Dinamis (Persentase dari Saldo Awal)
  const budgetBatas = {
    'Makanan & Minuman': saldoAwal * 0.40, // 40%
    'Transportasi': saldoAwal * 0.15,      // 15%
    'Kuliah': saldoAwal * 0.15,            // 15%
    'Tagihan': saldoAwal * 0.10,           // 10%
    'Belanja': saldoAwal * 0.10,           // 10%
    'Hiburan': saldoAwal * 0.05,           // 5%
    'Umum': saldoAwal * 0.05,              // 5%
  };

  const categories = Object.keys(budgetBatas);
  const totalBudget = saldoAwal > 0 ? saldoAwal : 1;
  const totalPercent = Math.min(100, Math.round((totalPengeluaran / totalBudget) * 100));

  return (
    <motion.div key="budget" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      
      {/* Kartu Ringkasan Terpakai */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Anggaran Terpakai Bulan Ini</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate" title={`Rp${totalPengeluaran.toLocaleString('id-ID')}`}>
                Rp{totalPengeluaran.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-gray-400 ml-2">/ Rp{saldoAwal.toLocaleString('id-ID')} ({totalPercent}%)</span>
              </h2>
            </div>
          </div>
          {totalPengeluaran > saldoAwal ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5" /> Defisit
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terkendali
            </span>
          )}
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mt-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${totalPengeluaran > saldoAwal ? 'bg-red-500' : 'bg-neutral-800'}`} 
            style={{ width: `${Math.min(100, (totalPengeluaran / totalBudget) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Daftar Kategori Dinamis dengan Icon */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
          <PieChart className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm sm:text-base font-bold text-gray-900">Batas Anggaran Per Kategori</h3>
        </div>

        <div className="space-y-5">
          {categories.map((cat) => {
            const terpakai = kategoriStats[cat] || 0;
            const batas = budgetBatas[cat];
            
            // Hindari NaN jika batas 0 (misal saldo awal belum diisi)
            const percentVal = batas > 0 ? (terpakai / batas) * 100 : 0;
            const percent = Math.min(100, Math.round(percentVal));
            
            // Logika Warna Warning: Merah jika melebihi batas budget kategori
            const isOverBudget = terpakai > batas;
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Umum'];
            const Icon = config.icon;
            
            return (
              <div key={cat} className="space-y-2 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{cat}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs block ${isOverBudget ? 'text-red-500 font-bold' : 'text-gray-600 font-medium'}`}>
                      Rp{terpakai.toLocaleString('id-ID')} / Rp{Math.round(batas).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {percent}% {isOverBudget && '⚠️ Melebihi Batas'}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-neutral-800'}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
