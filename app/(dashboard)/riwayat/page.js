'use client';

import { useTransaction } from '../../context/TransactionContext';
import RiwayatTab from '../../../components/tabs/RiwayatTab';

export default function RiwayatPage() {
  const { transactions, resetAllTransactions, deleteTransaction } = useTransaction();
  return (
    <RiwayatTab
      transactions={transactions}
      onResetData={resetAllTransactions}
      onDeleteTransaction={deleteTransaction}
    />
  );
}
