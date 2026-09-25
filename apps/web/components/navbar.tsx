'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { shortenAddress } from '@arcpay/sdk/utils';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Wallet,
  ExternalLink,
  ChevronDown,
  LogOut,
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
    { label: 'Demo Store', href: '/demo' },
    { label: 'PayLink Studio', href: '/create' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <div className="fixed z-50 pt-4 sm:pt-6 top-0 left-0 w-full px-4 sm:px-6 pointer-events-none">
      <header className="max-w-7xl mx-auto h-16 flex items-center justify-between px-5 sm:px-6 rounded-full border border-border/80 bg-white/70 backdrop-blur-xl shadow-[0_1px_2px_rgba(20,22,26,0.04)] pointer-events-auto">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-sentient text-lg text-foreground tracking-tight leading-none">
            ArcPay
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13px]">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-150 ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Testnet Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-700/20 text-[11px] font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Arc Testnet</span>
          </div>

          {/* Wallet Connection */}
          {isConnected && address ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-background hover:border-primary/40 text-foreground text-xs font-medium px-3.5 py-2 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>{shortenAddress(address)}</span>
                {balanceData && (
                  <span className="text-primary text-[11px] hidden sm:inline">
                    {parseFloat(balanceData.formatted).toFixed(2)} USDC
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-background shadow-lg p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-[10px] text-muted-foreground">
                      CONNECTED WALLET
                    </p>
                    <p className="text-xs text-foreground truncate mt-0.5">
                      {address}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.testnet.arc.io/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ArcScan Explorer
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      disconnect();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={handleConnect} className="h-9 px-4 text-xs gap-2">
              <Wallet className="w-3.5 h-3.5" />
              Connect
            </Button>
          )}
        </div>
      </header>
    </div>
  );
}