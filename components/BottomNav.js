'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, PieChart, Sparkles } from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/riwayat', label: 'Riwayat', icon: History },
  { href: '/budget', label: 'Budget', icon: PieChart },
  { href: '/insight', label: 'Insight', icon: Sparkles },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[1400px] mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 grid grid-cols-4 py-2 px-3 text-center shadow-lg z-20">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 ${
              active
                ? 'bg-neutral-900 text-white font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 transition-transform ${active ? 'scale-105' : ''}`} />
            <span className="text-[10px] sm:text-xs tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
