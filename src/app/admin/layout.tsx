'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  Settings, BarChart3, Scissors, Calendar, LogOut, Boxes,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const MENU = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/stitching', label: 'Stitching Requests', icon: Scissors },
  { href: '/admin/viewings', label: 'Private Viewings', icon: Calendar },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any).role !== 'ADMIN') {
      router.push('/login?callbackUrl=/admin');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session) {
    return <div className="min-h-screen flex items-center justify-center bg-navy-900 text-gold-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-cream-50">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-cream-100 fixed h-screen overflow-y-auto">
        <div className="p-5 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Dharsan" width={40} height={40} className="rounded-full" />
            <div>
              <p className="font-display text-base font-semibold text-gold-400">Dharsan</p>
              <p className="font-body text-[10px] text-navy-300 uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {MENU.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-navy-700">
          <div className="mb-3 px-2">
            <p className="font-body text-xs text-navy-300">Signed in as</p>
            <p className="font-body text-sm text-gold-400 font-semibold truncate">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="admin-sidebar-link w-full text-red-300 hover:bg-red-900/30"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
