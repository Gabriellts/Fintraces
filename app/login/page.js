'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTransaction } from '../context/TransactionContext';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  const { user, authReady, login } = useTransaction();
  const router = useRouter();

  // Sudah login → langsung ke Home
  useEffect(() => {
    if (authReady && user) router.replace('/');
  }, [authReady, user, router]);

  if (!authReady || user) return null;
  return <LoginForm onLogin={login} />;
}
