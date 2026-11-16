'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { href: '/', label: 'Home' },
  { href: '/riwayat', label: 'Riwayat' },
  { href: '/budget', label: 'Budget' },
  { href: '/insight', label: 'Insight' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-[1400px] mx-auto bg-white border-t border-gray-200 grid grid-cols-4 py-2.5 px-4 text-center shadow-lg z-20">
      {menuItems.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-2 rounded-xl transition-all ${
              active ? 'bg-neutral-800 text-white font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <div className="w-4 h-3.5 border-2 border-current rounded-sm mb-1" />
            <span className="text-[10px] sm:text-xs md:text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
