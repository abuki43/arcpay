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

  const { data: balanceData } = useBalance({ address });

  const handleConnect = () => {
    if (connectors.length > 0) connect({ connector: connectors[0] });
  };

  const navLinks = [
    { label: 'Demo Store', href: '/demo' },
    { label: 'PayLink Studio', href: '/create' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Network', href: '/network' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <div className="fixed z-50 pt-4 sm:pt-5 top-0 left-0 w-full px-4 sm:px-6 pointer-events-none">
      <header className="max-w-[1280px] mx-auto h-14 flex items-center justify-between px-4 sm:px-5 rounded-pill border border-line bg-canvas/80 backdrop-blur-md pointer-events-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-ctl bg-accent flex items-center justify-center text-canvas">
            <Zap className="w-3.5 h-3.5 fill-canvas" />
          </div>
          <span className="text-title font-semibold text-ink tracking-tightish leading-none">
            ArcPay
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-body">
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
                    ? 'text-ink font-medium'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 h-7 rounded-pill border border-line bg-raised text-tiny font-medium text-ink-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent arc-pulse" />
            <span>Arc Testnet</span>
          </div>

          {isConnected && address ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-pill border border-line bg-raised hover:border-line-strong text-ink text-tiny font-medium px-3 h-8 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>{shortenAddress(address)}</span>
                {balanceData && (
                  <span className="text-accent text-nano hidden sm:inline tabular-nums">
                    {parseFloat(balanceData.formatted).toFixed(2)} USDC
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-ink-3" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-ctl border border-line bg-raised p-1.5 z-50 text-body shadow-none">
                  <div className="px-3 py-2.5 border-b border-line mb-1">
                    <p className="text-nano uppercase tracking-mono-cap text-ink-3">
                      Connected wallet
                    </p>
                    <p className="text-tiny text-ink truncate mt-1 font-mono">
                      {address}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.testnet.arc.io/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-ink-2 hover:text-ink hover:bg-inset rounded-chip transition-colors"
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10 rounded-chip transition-colors mt-0.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              size="sm"
              className="gap-2"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect
            </Button>
          )}
        </div>
      </header>
    </div>
  );
}
