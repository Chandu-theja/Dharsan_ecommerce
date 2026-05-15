'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  ShoppingBag, Heart, Search, Menu, X, ChevronDown,
  User, Package, LogOut, Settings, Phone,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const CATEGORIES = {
  women: {
    label: 'Women',
    labelTE: 'మహిళలు',
    sections: [
      {
        title: 'Ethnic Wear',
        items: [
          { label: 'Sarees', href: '/category/sarees' },
          { label: 'Pattu Sarees', href: '/category/pattu-sarees' },
          { label: 'Salwar Suits (Stitched)', href: '/category/salwar-suits-stitched' },
          { label: 'Salwar Suits (Unstitched)', href: '/category/salwar-suits-unstitched' },
          { label: 'Churidars', href: '/category/churidars' },
          { label: 'Pavadai / Half Sarees', href: '/category/pavadai-half-sarees' },
          { label: 'Lehengas', href: '/category/lehengas' },
          { label: 'Blouse Pieces', href: '/category/blouse-pieces' },
        ],
      },
      {
        title: 'Casual & Daily',
        items: [
          { label: 'Nightwear', href: '/category/nightwear-women' },
          { label: 'Inners & Innerwear', href: '/category/inners-women' },
        ],
      },
    ],
  },
  men: {
    label: 'Men',
    labelTE: 'పురుషులు',
    sections: [
      {
        title: 'Formal & Casual',
        items: [
          { label: 'Plain Shirts (Formal)', href: '/category/formal-shirts' },
          { label: 'Plain Shirts (Casual)', href: '/category/casual-shirts' },
          { label: 'Plain Pants (Formal)', href: '/category/formal-pants' },
          { label: 'Plain Pants (Casual)', href: '/category/casual-pants' },
          { label: 'Suits & Blazers', href: '/category/suits-blazers' },
        ],
      },
      {
        title: 'Traditional',
        items: [
          { label: 'Dhotis / Panchas / Veshtis', href: '/category/dhotis-panchas' },
          { label: 'Lungis', href: '/category/lungis' },
          { label: 'Kurtas', href: '/category/kurtas' },
          { label: 'Sherwanis', href: '/category/sherwanis' },
          { label: 'Inners / Banians', href: '/category/inners-men' },
          { label: 'Towels', href: '/category/towels' },
        ],
      },
    ],
  },
  kids: {
    label: 'Kids',
    labelTE: 'పిల్లలు',
    sections: [
      {
        title: 'Girls',
        items: [
          { label: 'Frocks & Dresses', href: '/category/girls-frocks' },
          { label: 'Churidars', href: '/category/girls-churidars' },
          { label: 'Pavadai', href: '/category/girls-pavadai' },
        ],
      },
      {
        title: 'Boys',
        items: [
          { label: 'Shirts', href: '/category/boys-shirts' },
          { label: 'Pants & Trousers', href: '/category/boys-pants' },
          { label: 'Traditional Wear', href: '/category/boys-traditional' },
        ],
      },
    ],
  },
  more: {
    label: 'More',
    sections: [
      {
        title: 'Accessories',
        items: [
          { label: 'Belts', href: '/category/belts' },
          { label: 'Purses & Bags', href: '/category/purses-bags' },
        ],
      },
      {
        title: 'Fabric',
        items: [
          { label: 'Fabric by the Meter', href: '/category/fabric-by-meter' },
        ],
      },
      {
        title: 'Services',
        items: [
          { label: 'Custom Stitching', href: '/stitching' },
          { label: 'Private Viewing', href: '/private-viewing' },
        ],
      },
    ],
  },
};

export default function Navbar() {
  const { data: session } = useSession();
  const { getTotalItems, openCart } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const cartCount = getTotalItems();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-flex animate-marquee">
            {Array(4).fill(null).map((_, i) => (
              <span key={i} className="mx-8">
                🚚 Free Shipping on orders above ₹1,000 &nbsp;•&nbsp;
                ✂️ Best Stitching in Tirupati &nbsp;•&nbsp;
                🛍️ Huge Collection – Men, Women &amp; Kids &nbsp;•&nbsp;
                ⭐ Premium Quality at Affordable Prices
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-navy border-b border-cream-200' : 'bg-white border-b border-cream-200'
        }`}
        ref={menuRef}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Dharsan Dresses"
                width={48}
                height={48}
                priority
                className="rounded-full shadow-sm"
              />
              <div className="hidden sm:block">
                <div className="font-display text-xl font-semibold text-navy-900 leading-none">
                  Dharsan Dresses
                </div>
                <div className="font-body text-[10px] text-gold-600 tracking-[0.2em] uppercase mt-0.5">
                  Tirupati • Premium Wear
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <div key={key} className="relative">
                  <button
                    className={`flex items-center gap-1 px-4 py-2 font-body text-sm font-medium rounded transition-colors duration-200 ${
                      activeMenu === key
                        ? 'text-gold-600 bg-cream-100'
                        : 'text-navy-700 hover:text-gold-600 hover:bg-cream-100'
                    }`}
                    onMouseEnter={() => setActiveMenu(key)}
                    onClick={() => setActiveMenu(activeMenu === key ? null : key)}
                  >
                    {cat.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${activeMenu === key ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Mega Menu Dropdown */}
                  {activeMenu === key && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-cream-200 rounded-lg shadow-card-hover p-6 min-w-[480px] animate-slide-down z-50"
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                      <div className="grid grid-cols-2 gap-6">
                        {cat.sections.map((section) => (
                          <div key={section.title}>
                            <h4 className="font-body text-xs font-semibold text-gold-600 uppercase tracking-widest mb-3">
                              {section.title}
                            </h4>
                            <ul className="space-y-2">
                              {section.items.map((item) => (
                                <li key={item.href}>
                                  <Link
                                    href={item.href}
                                    className="font-body text-sm text-navy-700 hover:text-gold-600 hover:translate-x-1 transition-all duration-150 flex items-center gap-1 group"
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    <span className="w-1 h-1 rounded-full bg-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Link
                href="/products?filter=new"
                className="px-4 py-2 font-body text-sm font-medium text-navy-700 hover:text-gold-600 hover:bg-cream-100 rounded transition-colors duration-200"
              >
                New Arrivals
              </Link>

              <Link
                href="/products?filter=sale"
                className="px-4 py-2 font-body text-sm font-semibold text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
              >
                Sale 🔥
              </Link>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-full text-navy-700 hover:text-gold-600 hover:bg-cream-100 transition-colors"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2 rounded-full text-navy-700 hover:text-gold-600 hover:bg-cream-100 transition-colors hidden sm:flex"
                aria-label="Wishlist"
              >
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 rounded-full text-navy-700 hover:text-gold-600 hover:bg-cream-100 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gold-500 text-white text-xs font-semibold flex items-center justify-center font-body">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              {session ? (
                <div className="relative group hidden sm:block">
                  <button className="flex items-center gap-2 p-2 rounded-full text-navy-700 hover:text-gold-600 hover:bg-cream-100 transition-colors">
                    <User size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-cream-200 rounded-lg shadow-card-hover p-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <p className="px-3 py-2 text-xs text-gray-500 font-body border-b border-cream-200 mb-1">
                      {session.user?.name}
                    </p>
                    <Link href="/orders" className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-cream-100 rounded font-body">
                      <Package size={14} /> My Orders
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-cream-100 rounded font-body">
                      <Settings size={14} /> Profile
                    </Link>
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-gold-600 hover:bg-cream-100 rounded font-body font-semibold">
                        <Settings size={14} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded w-full font-body"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-navy-800 text-gold-400 hover:bg-navy-700 rounded font-body text-sm font-medium transition-colors"
                >
                  <User size={15} /> Login
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-full text-navy-700 hover:bg-cream-100 transition-colors"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar (slides down) */}
        {searchOpen && (
          <div className="border-t border-cream-200 bg-cream-50 animate-slide-down">
            <div className="container-custom py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                }}
                className="relative max-w-2xl mx-auto"
              >
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for sarees, shirts, suits, fabrics..."
                  className="input-field pl-11 pr-4"
                  autoFocus
                />
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-white overflow-y-auto animate-slide-down shadow-2xl">
            <div className="bg-navy-900 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-xl text-gold-400 font-semibold">Dharsan Dresses</div>
                  <div className="font-body text-xs text-navy-300 mt-0.5">Best Clothes · Best Stitch</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-navy-300 hover:text-white">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-4">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <details key={key} className="border-b border-cream-200">
                  <summary className="flex items-center justify-between py-3.5 cursor-pointer font-body font-medium text-navy-800 list-none">
                    {cat.label}
                    <ChevronDown size={16} className="text-gold-500" />
                  </summary>
                  <div className="pb-3 pl-2">
                    {cat.sections.map((section) => (
                      <div key={section.title} className="mb-3">
                        <p className="text-xs font-semibold text-gold-600 uppercase tracking-wider mb-2">{section.title}</p>
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block py-1.5 text-sm text-navy-700 hover:text-gold-600 font-body"
                            onClick={() => setMobileOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              ))}

              <Link href="/products?filter=new" className="block py-3.5 border-b border-cream-200 font-body font-medium text-navy-800" onClick={() => setMobileOpen(false)}>
                New Arrivals ✨
              </Link>
              <Link href="/products?filter=sale" className="block py-3.5 border-b border-cream-200 font-body font-semibold text-red-600" onClick={() => setMobileOpen(false)}>
                Sale 🔥
              </Link>

              <div className="mt-4 space-y-2">
                {session ? (
                  <>
                    <Link href="/orders" className="flex items-center gap-2 py-2 text-sm font-body text-navy-700" onClick={() => setMobileOpen(false)}>
                      <Package size={16} /> My Orders
                    </Link>
                    <button onClick={() => signOut()} className="flex items-center gap-2 py-2 text-sm font-body text-red-600 w-full">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="flex items-center justify-center gap-2 py-3 bg-navy-800 text-gold-400 rounded font-body font-medium" onClick={() => setMobileOpen(false)}>
                    <User size={16} /> Login / Register
                  </Link>
                )}
              </div>

              <div className="mt-6 p-4 bg-cream-100 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-navy-700 font-body">
                  <Phone size={15} className="text-gold-500" />
                  <span>Call Us: {process.env.NEXT_PUBLIC_PHONE || '+91 XXXXXXXXXX'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
