'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransaction } from '../context/TransactionContext';
import { useSummary } from '@/lib/useSummary';
import HomeTab from '../../components/tabs/HomeTab';
import EditSaldoModal from '../../components/EditSaldoModal';
import EditSavingGoalModal from '../../components/EditSavingGoalModal';

export default function HomePage() {
  const router = useRouter();
  const { transactions, loading, saldoAwal, savingGoals, deleteTransaction, saveSaldo, addGoal, deleteGoal } = useTransaction();
  const { sisaHari, totalPengeluaran, sisaSaldo, amanJajanHariIni, dataChart } = useSummary();

  const [isEditingSaldo, setIsEditingSaldo] = useState(false);
  const [inputSaldo, setInputSaldo] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const handleSaveSaldo = async (e) => {
    e.preventDefault();
    const nominal = Number(inputSaldo);
    if (isNaN(nominal) || nominal < 0) return alert('Masukkan nominal yang valid!');
    await saveSaldo(nominal);
    setIsEditingSaldo(false);
    setInputSaldo('');
  };

  const handleAddGoal = async (goal) => {
    if (await addGoal(goal)) setIsAddingGoal(false);
  };

  return (
    <>
      <HomeTab
        amanJajanHariIni={amanJajanHariIni}
        sisaHari={sisaHari}
        totalPengeluaran={totalPengeluaran}
        transactions={transactions}
        sisaSaldo={sisaSaldo}
        saldoAwal={saldoAwal}
        dataChart={dataChart}
        loading={loading}
        savingGoals={savingGoals}
        onOpenEditSaldo={() => { setInputSaldo(saldoAwal); setIsEditingSaldo(true); }}
        onNavigateTab={(tab) => router.push(tab === 'home' ? '/' : `/${tab}`)}
        onDeleteTransaction={deleteTransaction}
        onOpenAddGoal={() => setIsAddingGoal(true)}
        onDeleteGoal={deleteGoal}
      />

      {isEditingSaldo && (
        <EditSaldoModal
          inputSaldo={inputSaldo}
          setInputSaldo={setInputSaldo}
          onSave={handleSaveSaldo}
          onClose={() => setIsEditingSaldo(false)}
        />
      )}
      {isAddingGoal && (
        <EditSavingGoalModal
          onClose={() => setIsAddingGoal(false)}
          onSave={handleAddGoal}
          sisaSaldo={sisaSaldo}
        />
      )}
    </>
  );
}
