'use client';

import { useTransaction } from '../../context/TransactionContext';
import { useSummary } from '@/lib/useSummary';
import InsightTab from '../../../components/tabs/InsightTab';

export default function InsightPage() {
  const { transactions, saldoAwal } = useTransaction();
  const { totalPengeluaran, sisaSaldo, amanJajanHariIni } = useSummary();
  return (
    <InsightTab
      transactions={transactions}
      saldoAwal={saldoAwal}
      totalPengeluaran={totalPengeluaran}
      sisaSaldo={sisaSaldo}
      amanJajanHariIni={amanJajanHariIni}
    />
  );
}
