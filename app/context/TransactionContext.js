'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { validateTelegramId } from '@/lib/utils';

const TransactionContext = createContext(null);
const USER_KEY = 'fintraces_user';

export function TransactionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // true setelah cek localStorage selesai
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saldoAwal, setSaldoAwal] = useState(0);
  const [savingGoals, setSavingGoals] = useState([]);

  // Ambil semua data milik user (saldo, target tabungan, transaksi)
  const fetchAll = useCallback(async (telegramId) => {
    setLoading(true);
    const id = String(telegramId);

    const { data: settingData, error: settingError } = await supabase
      .from('user_settings').select('saldo_awal').eq('telegram_id', id).maybeSingle();
    if (!settingError && settingData) {
      setSaldoAwal(Number(settingData.saldo_awal) || 0);
    } else {
      const saved = localStorage.getItem(`saldo_awal_${id}`);
      setSaldoAwal(saved !== null ? Number(saved) : 0);
    }

    const { data: goalsData } = await supabase
      .from('saving_goals').select('*').eq('telegram_id', id)
      .order('created_at', { ascending: true });
    setSavingGoals(goalsData || []);

    const { data, error } = await supabase
      .from('transactions').select('*').eq('telegram_id', id)
      .order('created_at', { ascending: false });
    if (!error) setTransactions(data || []);
    else console.error('Gagal mengambil data transaksi:', error);

    setLoading(false);
  }, []);

  // Pulihkan sesi saat halaman di-refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        if (validateTelegramId(u?.id).valid) {
          setUser(u);
          fetchAll(u.id);
        } else {
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch (e) {
      console.error('Gagal memulihkan sesi:', e);
    }
    setAuthReady(true);
  }, [fetchAll]);

  const login = (telegramUser) => {
    if (!validateTelegramId(telegramUser?.id).valid) return;
    setUser(telegramUser);
    try { localStorage.setItem(USER_KEY, JSON.stringify(telegramUser)); } catch {}
    if (telegramUser?.id) fetchAll(telegramUser.id);
  };

  const logout = () => {
    setUser(null);
    setTransactions([]);
    setSavingGoals([]);
    setSaldoAwal(0);
    try { localStorage.removeItem(USER_KEY); } catch {}
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Yakin ingin menghapus catatan ini?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const resetAllTransactions = async () => {
    if (!user?.id) return;
    if (!confirm('⚠️ Reset semua data transaksi secara permanen?')) return;
    const { error } = await supabase.from('transactions').delete().eq('telegram_id', String(user.id));
    if (!error) {
      setTransactions([]);
      alert('Data berhasil di-reset!');
    }
  };

  const saveSaldo = async (nominal) => {
    setSaldoAwal(nominal);
    localStorage.setItem(`saldo_awal_${user.id}`, nominal);
    const { error } = await supabase.from('user_settings').upsert(
      { telegram_id: String(user.id), saldo_awal: nominal, updated_at: new Date().toISOString() },
      { onConflict: 'telegram_id' }
    );
    if (error) {
      console.error('Gagal simpan ke Supabase:', error);
      alert('⚠️ Gagal menyinkronkan saldo ke cloud Supabase!');
    } else {
      alert('✅ Saldo berhasil disimpan & disinkronkan!');
    }
  };

  const addGoal = async (newGoal) => {
    const payload = {
      telegram_id: String(user.id),
      title: newGoal.title,
      target: Number(newGoal.target) || 0,
      current: Number(newGoal.current) || 0,
      target_months: Number(newGoal.target_months) || 1,
    };
    const { data, error } = await supabase.from('saving_goals').insert([payload]).select();
    if (error) {
      console.error('Error insert goal:', error);
      alert(`⚠️ Gagal menyimpan: ${error.message}`);
      return false;
    }
    if (data?.length > 0) {
      setSavingGoals((prev) => [...prev, data[0]]);
      alert('✅ Target tabungan berhasil ditambahkan!');
      return true;
    }
    return false;
  };

  const deleteGoal = async (id) => {
    if (!confirm('Yakin ingin menghapus target tabungan ini?')) return;
    const { error } = await supabase.from('saving_goals').delete().eq('id', id);
    if (!error) setSavingGoals((prev) => prev.filter((g) => g.id !== id));
    else {
      console.error('Error delete goal:', error);
      alert('⚠️ Gagal menghapus target tabungan!');
    }
  };

  const totalExpense = transactions.reduce(
    (sum, item) => sum + (Number(item.price || item.nominal || item.amount) || 0), 0
  );

  return (
    <TransactionContext.Provider
      value={{
        user, authReady, transactions, loading, saldoAwal, savingGoals, totalExpense,
        login, logout, fetchAll,
        deleteTransaction, resetAllTransactions,
        saveSaldo, addGoal, deleteGoal,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransaction harus dipakai di dalam TransactionProvider');
  return ctx;
}
