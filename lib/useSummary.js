import { useTransaction } from '@/app/context/TransactionContext';
import { getStandardCategory } from './utils';

// Hitungan turunan yang dipakai Home, Budget, dan Insight
export function useSummary() {
  const { transactions, saldoAwal, totalExpense } = useTransaction();

  const now = new Date();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const sisaHari = Math.max(1, totalDaysInMonth - now.getDate() + 1);

  const totalPengeluaran = totalExpense;
  const sisaSaldo = saldoAwal - totalPengeluaran;
  const amanJajanHariIni = sisaSaldo > 0 ? Math.floor(sisaSaldo / sisaHari) : 0;

  const kategoriStats = transactions.reduce((acc, item) => {
    const cat = getStandardCategory(item.category);
    acc[cat] = (acc[cat] || 0) + (Number(item.price || item.nominal || item.amount) || 0);
    return acc;
  }, {});

  const dataChart = Object.keys(kategoriStats).map((name) => ({
    name,
    value: kategoriStats[name],
    display: `Rp${kategoriStats[name].toLocaleString('id-ID')}`,
  }));

  return { sisaHari, totalPengeluaran, sisaSaldo, amanJajanHariIni, kategoriStats, dataChart };
}
