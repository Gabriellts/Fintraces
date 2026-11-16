'use client';

import { useTransaction } from '../../context/TransactionContext';
import { useSummary } from '@/lib/useSummary';
import BudgetTab from '../../../components/tabs/BudgetTab';

export default function BudgetPage() {
  const { saldoAwal } = useTransaction();
  const { totalPengeluaran, kategoriStats } = useSummary();
  return (
    <BudgetTab
      totalPengeluaran={totalPengeluaran}
      saldoAwal={saldoAwal}
      kategoriStats={kategoriStats}
    />
  );
}
