import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type Address,
  type Hash,
  createPublicClient,
  encodeFunctionData,
  fallback,
  getAddress,
  http,
} from 'viem';
import { ARC_PAYMENT_GATEWAY_ABI } from './abi';
import {
  DEFAULT_CHAIN_ID,
  DEFAULT_GATEWAY_ADDRESSES,
  SUPPORTED_CHAINS,
  arcTestnet,
  arcMainnet,
  PROTOCOL_FEE_BPS,
  BPS_DIVISOR,
} from './constants';
import type {
  ArcPayButtonProps,
  ArcPayTheme,
  CheckoutParams,
  PaymentReceipt,
} from './types';
import {
  calculateArcFee,
  formatUsdc,
  generateOrderId,
  getExplorerTxUrl,
  parseUsdc,
  shortenAddress,
} from './utils';
import { discoverWallet, switchToChain } from './wallet';
import { humanizeCheckoutError } from './errors';

// -----------------------------------------------------------------------------
// Design tokens — ArcPay "Instrument" theme
// These mirror the public ArcPay site (apps/web/app/globals.css) so the SDK
// popup looks identical when launched from any page.
// -----------------------------------------------------------------------------
const T = {
  // surfaces
  backdrop:        'rgba(11, 11, 10, 0.85)',
  backdropFilter:  'blur(12px)',
  canvas:          '#0B0B0A',
  surface:         '#141413',
  raised:          '#1C1C1B',
  inset:           '#232322',
  // hairlines
  line:            '#2A2A29',
  lineStrong:      '#3F3E3C',
  // ink
  ink:             '#F0EFEC',
  ink2:            '#B0AEA9',
  ink3:            '#8D8B86',
  // accent
  accent:          '#F5A524',
  accentHover:     '#E89216',
  accentSurface:   'rgba(245, 165, 36, 0.10)',
  accentBorder:    'rgba(245, 165, 36, 0.30)',
  // semantic
  danger:          '#E5484D',
  dangerSurface:   'rgba(229, 72, 77, 0.10)',
  dangerBorder:    'rgba(229, 72, 77, 0.20)',
  // shape
  radiusCard:      '8px',
  radiusButton:    '6px',
  radiusPill:      '9999px',
  // type
  fontSans:        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontMono:        'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

const isInstrument = (theme: ArcPayTheme) =>
  theme === 'instrument' || theme === 'instrument-light';
const isInstrumentLight = (theme: ArcPayTheme) => theme === 'instrument-light';

/** Generous per-request timeout; public Arc endpoints can stall under load. */
const RPC_TIMEOUT_MS = 20_000;

// -----------------------------------------------------------------------------
// Helper: Arc Chain Hex & Parameters for Injected Wallets
// -----------------------------------------------------------------------------
const LightningGlyph = ({ size = 16, color }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color || 'currentColor'}
    aria-hidden
  >
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const PulseDot = ({ color = T.accent }: { color?: string }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 0 0 ${color}`,
      animation: 'arcpay-pulse 1.6s ease-in-out infinite',
    }}
  />
);

const PULSE_KEYFRAMES = `
@keyframes arcpay-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.7); }
}
@keyframes arcpay-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .arcpay-pulse { animation: none !important; }
}
`;

function getChainParams(chainId: number, rpcUrl?: string) {
  const isTestnet = chainId === 5042002;
  const chain = isTestnet ? arcTestnet : arcMainnet;
  return {
    chainId: `0x${chainId.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [rpcUrl || chain.rpcUrls.default.http[0]],
    blockExplorerUrls: [chain.blockExplorers?.default.url],
  };
}

// -----------------------------------------------------------------------------
// Headless React Hook: useCheckout
// -----------------------------------------------------------------------------
export interface UseCheckoutReturn {
  checkout: (params: CheckoutParams) => Promise<PaymentReceipt | null>;
  isConnecting: boolean;
  isPaying: boolean;
  isSuccess: boolean;
  error: Error | null;
  receipt: PaymentReceipt | null;
  reset: () => void;
}

export function useCheckout(): UseCheckoutReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const reset = useCallback(() => {
    setIsConnecting(false);
    setIsPaying(false);
    setIsSuccess(false);
    setError(null);
    setReceipt(null);
  }, []);

  const checkout = useCallback(
    async (params: CheckoutParams): Promise<PaymentReceipt | null> => {
      reset();
      setIsConnecting(true);

      const chainId = params.chainId || DEFAULT_CHAIN_ID;
      const targetChain = SUPPORTED_CHAINS[chainId] || arcMainnet;
      const rpcUrl = params.rpcUrl;
      const gatewayAddress =
        params.contractAddress ||
        DEFAULT_GATEWAY_ADDRESSES[chainId] ||
        DEFAULT_GATEWAY_ADDRESSES[DEFAULT_CHAIN_ID];

      const ethereum = await discoverWallet();
      if (!ethereum) {
        const err = new Error('No EVM wallet found. Please install MetaMask, Rabby, or an Arc-compatible browser wallet.');
        setError(err);
        setIsConnecting(false);
        throw err;
      }

      try {
        const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No wallet accounts selected.');
        }
        const payer = getAddress(accounts[0]);

        await switchToChain(ethereum, chainId, rpcUrl);

        setIsConnecting(false);
        setIsPaying(true);

        const orderId = params.orderId || generateOrderId('arcpay');
        const grossAmount = parseUsdc(params.amount);
        if (grossAmount === 0n) {
          throw new Error('Payment amount must be greater than 0.');
        }
        const metadataStr =
          typeof params.metadata === 'object'
            ? JSON.stringify(params.metadata)
            : params.metadata || '';

        let data: `0x${string}`;
        let functionName: 'payNative' | 'payNativeWithSplit';
        let args: readonly [`0x${string}`, `0x${string}`, string] | readonly [`0x${string}`, `0x${string}`, bigint, `0x${string}`, bigint, string];

        if (params.affiliate && params.affiliateAmount) {
          const affAmount = parseUsdc(params.affiliateAmount);
          if (affAmount === 0n) {
            throw new Error('Affiliate amount must be greater than 0.');
          }
          const fee = (grossAmount * BigInt(PROTOCOL_FEE_BPS)) / BigInt(BPS_DIVISOR);
          const net = grossAmount - fee;
          const merchAmount = net - affAmount;

          functionName = 'payNativeWithSplit';
          args = [
            orderId,
            getAddress(params.merchant),
            merchAmount,
            getAddress(params.affiliate),
            affAmount,
            metadataStr,
          ];
        } else {
          functionName = 'payNative';
          args = [orderId, getAddress(params.merchant), metadataStr];
        }

        data = encodeFunctionData({
          abi: ARC_PAYMENT_GATEWAY_ABI,
          functionName,
          args,
        });

        // Try the caller-supplied RPC first, then the chain's public endpoint. A
        // single flaky node must not be able to block a payment.
        const publicClient = createPublicClient({
          chain: targetChain,
          transport: fallback(
            [
              ...(rpcUrl ? [http(rpcUrl, { timeout: RPC_TIMEOUT_MS, retryCount: 1 })] : []),
              http(targetChain.rpcUrls.default.http[0], { timeout: RPC_TIMEOUT_MS, retryCount: 1 }),
            ],
            { retryCount: 2 },
          ),
        });

        // Simulation catches reverts before the wallet prompts. Network blips
        // are tolerated so a slow node cannot fail an otherwise valid payment.
        try {
          await publicClient.simulateContract({
            address: gatewayAddress,
            abi: ARC_PAYMENT_GATEWAY_ABI,
            functionName,
            args,
            value: grossAmount,
            account: payer,
          });
        } catch (simErr) {
          const message = simErr instanceof Error ? simErr.message : String(simErr);
          const isRevert =
            /revert|execution failed|PaymentAlreadySettled|InvalidAmount|InvalidMerchant|InvalidAffiliate|InvalidSplitAmounts|TransferFailed/i.test(
              message,
            );
          const isNetwork =
            /Failed to fetch|fetch failed|HTTP request failed|timeout|ECONN|aborted|socket hang up/i.test(
              message,
            );

          if (isRevert) throw simErr;
          if (!isNetwork) throw simErr;

          console.warn(
            '[arcpay] simulation skipped after a transport error; continuing:',
            message,
          );
        }

        const txHash: Hash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: payer,
              to: gatewayAddress,
              value: `0x${grossAmount.toString(16)}`,
              data,
            },
          ],
        });

        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 30_000,
        });

        if (txReceipt.status !== 'success') {
          throw new Error('Transaction was reverted on Arc Network.');
        }

        const blockNumber = txReceipt.blockNumber;

        // 6. Construct settled receipt
        const fee = (grossAmount * BigInt(PROTOCOL_FEE_BPS)) / BigInt(BPS_DIVISOR);
        const settledReceipt: PaymentReceipt = {
          orderId,
          txHash,
          merchant: getAddress(params.merchant),
          payer,
          amount: grossAmount,
          protocolFee: fee,
          timestamp: Date.now(),
          blockNumber,
          metadata: metadataStr,
        };

        setReceipt(settledReceipt);
        setIsPaying(false);
        setIsSuccess(true);
        return settledReceipt;
      } catch (err: any) {
        setIsConnecting(false);
        setIsPaying(false);
        // Keep the full provider/viem detail for debugging; surface short copy.
        console.error('[arcpay] checkout failed:', err);
        const customError = humanizeCheckoutError(err);
        setError(customError);
        throw customError;
      }
    },
    [reset]
  );

  return { checkout, isConnecting, isPaying, isSuccess, error, receipt, reset };
}

// -----------------------------------------------------------------------------
// Component: Checkout Modal — Instrument theme
// -----------------------------------------------------------------------------
interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CheckoutParams;
  onSuccess?: (receipt: PaymentReceipt) => void;
  onError?: (error: Error) => void;
  theme?: ArcPayTheme;
}

export function CheckoutModal({
  isOpen,
  onClose,
  params,
  onSuccess,
  onError,
  theme = 'instrument',
}: CheckoutModalProps) {
  const { checkout, isConnecting, isPaying, isSuccess, error, receipt, reset } = useCheckout();
  const chainId = params.chainId || DEFAULT_CHAIN_ID;
  const useInstrument = isInstrument(theme);
  const useLight = isInstrumentLight(theme);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const grossAmount = parseUsdc(params.amount);
  const feeInfo = calculateArcFee(params.amount);
  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum);

  // Surface tokens for legacy themes (back-compat rendering of emerald / light)
  const lg = !useInstrument
    ? {
        backdrop:    'rgba(15, 23, 42, 0.65)',
        backdropF:   'blur(4px)',
        card:        '#ffffff',
        cardBorder:  'none',
        cardShadow:  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        box:         '#f8fafc',
        boxBorder:   '1px solid #e2e8f0',
        text:        '#0f172a',
        sub:         '#64748b',
        muted:       '#94a3b8',
        accent:      '#047857',
        accentBg:    '#ecfdf5',
        accentBorder:'1px solid #a7f3d0',
        danger:      '#991b1b',
        dangerBg:    '#fef2f2',
        dangerBorder:'1px solid #fecaca',
        outlineBtn:  '#ffffff',
        outlineBorder: '1.5px solid #047857',
      }
    : useLight
    ? {
        backdrop:    'rgba(11, 11, 10, 0.85)',
        backdropF:   'blur(12px)',
        card:        '#FFFFFF',
        cardBorder:  '1px solid #E8E5DE',
        cardShadow:  'none',
        box:         '#F4F2EB',
        boxBorder:   '1px solid #E8E5DE',
        text:        '#0B0B0A',
        sub:         '#5C5A55',
        muted:       '#8D8B86',
        accent:      '#0B0B0A',
        accentBg:    '#F5A524',
        accentBorder:'none',
        danger:      '#991b1b',
        dangerBg:    '#FEF2F2',
        dangerBorder:'1px solid #FECACA',
        outlineBtn:  '#FFFFFF',
        outlineBorder: '1.5px solid #0B0B0A',
      }
    : {
        // Default 'instrument' (dark)
        backdrop:    T.backdrop,
        backdropF:   T.backdropFilter,
        card:        T.surface,
        cardBorder:  `1px solid ${T.line}`,
        cardShadow:  'none',
        box:         T.raised,
        boxBorder:   `1px solid ${T.line}`,
        text:        T.ink,
        sub:         T.ink2,
        muted:       T.ink3,
        accent:      T.accent,
        accentBg:    T.accentSurface,
        accentBorder:`1px solid ${T.accentBorder}`,
        danger:      T.danger,
        dangerBg:    T.dangerSurface,
        dangerBorder:`1px solid ${T.dangerBorder}`,
        outlineBtn:  'transparent',
        outlineBorder:`1.5px solid ${T.lineStrong}`,
      };

  const handlePayClick = async () => {
    try {
      const res = await checkout(params);
      if (res && onSuccess) onSuccess(res);
    } catch (err: any) {
      if (onError) onError(err);
    }
  };

  const payLinkUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pay?merchant=${params.merchant}&amount=${formatUsdc(grossAmount)}&item=${encodeURIComponent(params.item || 'Order')}&chainId=${chainId}`
    : '';

  return (
    <>
      <style>{PULSE_KEYFRAMES}</style>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: lg.backdrop,
          backdropFilter: lg.backdropF,
          WebkitBackdropFilter: lg.backdropF,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: lg.card,
            border: lg.cardBorder,
            borderRadius: T.radiusCard,
            width: '100%',
            maxWidth: '400px',
            padding: '20px',
            boxShadow: lg.cardShadow,
            fontFamily: T.fontSans,
            color: lg.text,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: T.radiusButton,
                  backgroundColor: T.accent,
                  color: T.canvas,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LightningGlyph size={14} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: lg.text,
                    fontFamily: T.fontSans,
                    letterSpacing: '-0.005em',
                  }}
                >
                  ArcPay checkout
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: lg.muted,
                    fontFamily: T.fontMono,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: '2px',
                  }}
                >
                  {chainId === 5042 ? 'Arc mainnet' : 'Arc testnet'} · {chainId} · native USDC
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: `1px solid ${lg.boxBorder}`,
                color: lg.muted,
                padding: '4px 8px',
                borderRadius: T.radiusButton,
                cursor: 'pointer',
                fontSize: '12px',
                lineHeight: 1,
                fontFamily: T.fontMono,
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = lg.text;
                e.currentTarget.style.borderColor = lg.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = lg.muted;
                e.currentTarget.style.borderColor = lg.boxBorder;
              }}
            >
              esc
            </button>
          </div>

          {/* Order Summary Box */}
          <div
            style={{
              backgroundColor: lg.box,
              border: lg.boxBorder,
              borderRadius: T.radiusButton,
              padding: '14px 16px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: lg.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {params.item || 'One-time purchase'}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: lg.muted,
                    fontFamily: T.fontMono,
                    marginTop: '3px',
                    letterSpacing: '0.02em',
                  }}
                >
                  to {shortenAddress(params.merchant)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 600,
                    color: lg.text,
                    fontFamily: T.fontMono,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  ${formatUsdc(grossAmount)}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: lg.muted,
                      marginLeft: '4px',
                      letterSpacing: '0.06em',
                    }}
                  >
                    USDC
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: lg.muted,
                    fontFamily: T.fontMono,
                    marginTop: '4px',
                    letterSpacing: '0.02em',
                  }}
                >
                  fee 0.40% · ${feeInfo.formattedFee}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Body State */}
          {isSuccess && receipt ? (
            <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: T.radiusButton,
                  backgroundColor: lg.accentBg,
                  color: lg.accent,
                  border: lg.accentBorder,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <LightningGlyph size={22} />
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: lg.text,
                  marginBottom: '2px',
                  letterSpacing: '-0.01em',
                }}
              >
                Payment settled
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: lg.sub,
                  marginBottom: '16px',
                  fontFamily: T.fontMono,
                  letterSpacing: '0.02em',
                }}
              >
                Confirmed in ~600ms on Arc L1
                {receipt.blockNumber > 0n ? ` · block #${receipt.blockNumber}` : ''}
              </div>

              <div
                style={{
                  backgroundColor: lg.box,
                  border: lg.boxBorder,
                  borderRadius: T.radiusButton,
                  padding: '10px 14px',
                  marginBottom: '14px',
                  textAlign: 'left',
                }}
              >
                <ReceiptRow
                  label="Transaction"
                  value={
                    <a
                      href={getExplorerTxUrl(chainId, receipt.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: lg.accent,
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontFamily: T.fontMono,
                        fontSize: '11px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {receipt.txHash.slice(0, 10)}…{receipt.txHash.slice(-8)} ↗
                    </a>
                  }
                  muted={lg.muted}
                  text={lg.text}
                />
                <ReceiptRow
                  label="Order ID"
                  value={
                    <span
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: '11px',
                        color: lg.text,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {receipt.orderId.slice(0, 14)}…
                    </span>
                  }
                  muted={lg.muted}
                  text={lg.text}
                />
                <ReceiptRow
                  label="Settled"
                  value={
                    <span
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: lg.accent,
                      }}
                    >
                      ${formatUsdc(receipt.amount)} USDC
                    </span>
                  }
                  muted={lg.muted}
                  text={lg.text}
                  last
                />
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  backgroundColor: lg.accent,
                  color: useLight ? '#FFFFFF' : T.canvas,
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: T.fontSans,
                  padding: '11px 16px',
                  borderRadius: T.radiusButton,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <div>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    backgroundColor: lg.dangerBg,
                    border: lg.dangerBorder,
                    color: lg.danger,
                    fontSize: '11px',
                    fontFamily: T.fontMono,
                    padding: '10px 12px',
                    borderRadius: T.radiusButton,
                    marginBottom: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ flexShrink: 0, marginTop: '1px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                  </span>
                  <span>{error.message}</span>
                </div>
              )}

              {hasInjected ? (
                <button
                  onClick={handlePayClick}
                  disabled={isConnecting || isPaying}
                  className="arcpay-pulse-target"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: isConnecting || isPaying ? lg.accent + 'CC' : lg.accent,
                    color: useLight ? '#FFFFFF' : T.canvas,
                    fontWeight: 600,
                    fontSize: '13px',
                    fontFamily: T.fontSans,
                    padding: '12px 16px',
                    borderRadius: T.radiusButton,
                    border: 'none',
                    cursor: isConnecting || isPaying ? 'wait' : 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isConnecting && !isPaying) {
                      e.currentTarget.style.backgroundColor = T.accentHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isConnecting && !isPaying) {
                      e.currentTarget.style.backgroundColor = lg.accent;
                    }
                  }}
                >
                  {(isConnecting || isPaying) && <PulseDot color={useLight ? '#FFFFFF' : T.canvas} />}
                  <span>
                    {isConnecting
                      ? 'Connecting wallet…'
                      : isPaying
                      ? 'Confirming on Arc (~600ms)…'
                      : `Pay $${formatUsdc(grossAmount)} USDC`}
                  </span>
                </button>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: lg.sub,
                      marginBottom: '10px',
                      fontFamily: T.fontMono,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Scan with MetaMask or a mobile EVM browser:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '8px',
                      backgroundColor: lg.box,
                      border: lg.boxBorder,
                      borderRadius: T.radiusButton,
                      marginBottom: '10px',
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payLinkUrl)}`}
                      alt="Scan to Pay"
                      style={{ width: '150px', height: '150px', borderRadius: '4px' }}
                    />
                  </div>
                  <a
                    href={`https://metamask.app.link/dapp/${typeof window !== 'undefined' ? window.location.host : ''}/pay?merchant=${params.merchant}&amount=${formatUsdc(grossAmount)}&chainId=${chainId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      backgroundColor: 'transparent',
                      color: lg.text,
                      border: lg.outlineBorder,
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontFamily: T.fontSans,
                      fontSize: '12px',
                      padding: '10px 12px',
                      borderRadius: T.radiusButton,
                    }}
                  >
                    Open in MetaMask mobile
                  </a>
                </div>
              )}

              <div
                style={{
                  marginTop: '12px',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: lg.muted,
                  fontFamily: T.fontMono,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Secured by ArcPaymentGateway · Non-custodial
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Tiny helper component for receipt rows so the success block stays readable
function ReceiptRow({
  label,
  value,
  muted,
  text,
  last,
}: {
  label: string;
  value: React.ReactNode;
  muted: string;
  text: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: last ? 'none' : '1px solid transparent',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          color: muted,
          fontFamily: T.fontMono,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span style={{ color: text }}>{value}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pre-built Component: ArcPayButton
// -----------------------------------------------------------------------------
export function ArcPayButton({
  merchant,
  amount,
  item,
  metadata,
  affiliate,
  affiliateAmount,
  theme = 'instrument',
  label,
  size = 'md',
  className = '',
  style = {},
  chainId = DEFAULT_CHAIN_ID,
  contractAddress,
  rpcUrl,
  onSuccess,
  onError,
  onCancel,
}: ArcPayButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formattedAmount = useMemo(() => {
    try {
      const parsed = parseUsdc(amount);
      return formatUsdc(parsed);
    } catch {
      return amount.toString();
    }
  }, [amount]);

  const useInstrument = isInstrument(theme);
  const useLight = isInstrumentLight(theme);

  const buttonStyle = useMemo<React.CSSProperties>(() => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: T.fontSans,
      fontWeight: 500,
      borderRadius: T.radiusButton,
      border: '1px solid transparent',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.05s ease',
      ...style,
    };

    if (size === 'sm') {
      base.padding = '7px 12px';
      base.fontSize = '12px';
    } else if (size === 'lg') {
      base.padding = '12px 20px';
      base.fontSize = '14px';
    } else {
      base.padding = '9px 16px';
      base.fontSize = '13px';
    }

    if (theme === 'emerald') {
      base.backgroundColor = '#047857';
      base.color = '#ffffff';
      base.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
    } else if (theme === 'light') {
      base.backgroundColor = '#f8fafc';
      base.color = '#0f172a';
      base.border = '1px solid #e2e8f0';
    } else if (theme === 'minimal') {
      base.backgroundColor = 'transparent';
      base.color = '#047857';
      base.border = '1.5px solid #047857';
    } else if (theme === 'dark') {
      base.backgroundColor = '#0f172a';
      base.color = '#ffffff';
    } else if (useLight) {
      // 'instrument-light' — light surface, dark text, hairline
      base.backgroundColor = T.canvas;
      base.color = T.ink;
      base.border = `1px solid ${T.line}`;
    } else {
      // 'instrument' (default) — dark surface, light text, hairline
      base.backgroundColor = T.ink;
      base.color = T.canvas;
    }

    return base;
  }, [theme, size, style, useLight]);

  const buttonHoverStyle = useMemo<React.CSSProperties>(() => {
    if (theme === 'emerald' || theme === 'light' || theme === 'minimal' || theme === 'dark') {
      return {};
    }
    if (useLight) {
      return { backgroundColor: T.ink, color: T.canvas };
    }
    return { backgroundColor: T.ink2 };
  }, [theme, useLight]);

  const defaultText = label || `Pay $${formattedAmount} USDC`;

  const checkoutParams: CheckoutParams = {
    merchant,
    amount,
    item,
    metadata,
    affiliate,
    affiliateAmount,
    chainId,
    contractAddress,
    rpcUrl,
  };

  return (
    <>
      <style>{PULSE_KEYFRAMES}</style>
      <button
        type="button"
        className={`arcpay-btn ${className}`}
        style={buttonStyle}
        onClick={() => setIsOpen(true)}
        onMouseEnter={(e) => {
          if (buttonHoverStyle.backgroundColor) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = String(buttonHoverStyle.backgroundColor);
          }
          if (buttonHoverStyle.color) {
            (e.currentTarget as HTMLButtonElement).style.color = String(buttonHoverStyle.color);
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = String(buttonStyle.backgroundColor);
          (e.currentTarget as HTMLButtonElement).style.color = String(buttonStyle.color);
        }}
      >
        {useInstrument ? (
          <LightningGlyph
            size={size === 'sm' ? 12 : 14}
            color={useLight ? T.canvas : T.canvas}
          />
        ) : (
          <LightningGlyph size={size === 'sm' ? 12 : 14} />
        )}
        <span>{defaultText}</span>
      </button>

      <CheckoutModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          if (onCancel) onCancel();
        }}
        params={checkoutParams}
        theme={theme}
        onSuccess={(receipt) => {
          if (onSuccess) onSuccess(receipt);
        }}
        onError={onError}
      />
    </>
  );
}
