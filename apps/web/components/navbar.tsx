'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { shortenAddress } from '@arcpay/sdk';
import { CyberButton } from './cyber-button';
import {
  Zap,
  Wallet,
  ExternalLink,
  ChevronDown,
  LogOut,
  Sparkles,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: balanceData } = useBalance({
    address,
  });

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const navLinks = [
    { label: 'Demo Store', href: '/#demo' },
    { label: 'PayLink Studio', href: '/create' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <div className="fixed z-50 pt-4 sm:pt-6 top-0 left-0 w-full px-4 sm:px-6 pointer-events-none">
      <header className="max-w-7xl mx-auto h-16 flex items-center justify-between px-5 sm:px-6 rounded-2xl bg-[#070c14]/80 border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
              ArcPay
            </span>
            <span className="text-[9px] font-mono font-semibold text-emerald-400 tracking-wider uppercase leading-none mt-1">
              ARC L1 PROTOCOL
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Uppercase Mono) */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`uppercase tracking-wider transition-colors duration-150 ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                [{link.label}]
              </Link>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Testnet Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Arc Testnet</span>
          </div>

          {/* Wallet Connection */}
          {isConnected && address ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-mono font-semibold px-3.5 py-2 rounded-xl border border-white/10 hover:border-emerald-500/40 transition-all shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span>{shortenAddress(address)}</span>
                {balanceData && (
                  <span className="text-emerald-400 text-[11px] hidden sm:inline">
                    ({parseFloat(balanceData.formatted).toFixed(2)} USDC)
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0e1422] border border-white/10 shadow-2xl p-2 z-50 font-mono text-xs">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-[10px] text-slate-400">CONNECTED WALLET</p>
                    <p className="text-xs text-white truncate">{address}</p>
                  </div>
                  <a
                    href={`https://explorer.testnet.arc.io/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    ArcScan Explorer
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      disconnect();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <CyberButton
              variant="emerald"
              onClick={handleConnect}
              className="!h-10 !px-4 !text-xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>[ Connect ]</span>
            </CyberButton>
          )}
        </div>
      </header>
    </div>
  );
}
