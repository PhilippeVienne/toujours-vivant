'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Activity, Users, Settings } from 'lucide-react';
import { AuthButton } from './AuthButton';
import { useAuthSession } from '@/lib/useAuthSession';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthSession();

  const navLinks = [
    { href: '/', label: 'Tableau de bord', icon: ShieldCheck },
    { href: '/motion', label: 'Ping Passif', icon: Activity },
    { href: '/contacts', label: 'Proches', icon: Users },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090d16]/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Toujours Vivant
            </span>
            <span className="block text-[11px] font-semibold text-emerald-400 tracking-wider uppercase mt-0.5">
              Sécurité & Check-in
            </span>
          </div>
        </Link>

        {/* Navigation & Auth */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Desktop Navigation (Only rendered when logged in) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-2xl shadow-inner">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Google Auth Button */}
          <AuthButton />
        </div>

      </div>

      {/* Mobile Bottom Navigation Bar (Only rendered when logged in) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-800/80 px-3 py-2.5 flex justify-around items-center shadow-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all ${
                  isActive ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px]">{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
