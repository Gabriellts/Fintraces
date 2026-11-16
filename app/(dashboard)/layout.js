'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTransaction } from '../context/TransactionContext';
import BottomNav from '../../components/BottomNav';

export default function DashboardLayout({ children }) {
  const { user, authReady, logout } = useTransaction();
  const router = useRouter();

  // Belum login → paksa ke /login
  useEffect(() => {
    if (authReady && !user) router.replace('/login');
  }, [authReady, user, router]);

  if (!authReady || !user) return null;

  return (
    <div className="min-h-screen bg-gray-100 w-full max-w-[1400px] mx-auto relative pb-28 shadow-xl font-sans text-gray-900">
      <div className="bg-white min-h-screen p-4 sm:p-8 lg:p-12 pb-24">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FinTraces Logo" className="w-10 h-10 object-contain rounded-xl" />
            <div>
              <h2 className="text-xs text-gray-500">Selamat Datang,</h2>
              <p className="text-base md:text-xl font-bold text-gray-800">{user.first_name} ({user.id})</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.replace('/login'); }}
            className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-lg border border-red-200 transition-colors"
          >
            Keluar
          </button>
        </div>

        {children}
      </div>

      <BottomNav />
    </div>
  );
}
