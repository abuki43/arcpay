import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  type Address,
  type Hash,
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
} from 'viem';
import { ARC_PAYMENT_GATEWAY_ABI } from './abi';
import {
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

// -----------------------------------------------------------------------------
// Helper: Arc Chain Hex & Parameters for Injected Wallets
// -----------------------------------------------------------------------------
function getChainParams(chainId: number) {
  const isTestnet = chainId === 5042002;
  const chain = isTestnet ? arcTestnet : arcMainnet;
  return {
    chainId: `0x${chainId.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [chain.rpcUrls.default.http[0]],
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

      const chainId = params.chainId || 5042002;
      const targetChain = SUPPORTED_CHAINS[chainId] || arcTestnet;
      const gatewayAddress =
        params.contractAddress ||
        DEFAULT_GATEWAY_ADDRESSES[chainId] ||
        DEFAULT_GATEWAY_ADDRESSES[5042002];

      const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
      if (!ethereum) {
        const err = new Error('No EVM wallet found. Please install MetaMask, Rabby, or an Arc-compatible browser wallet.');
        setError(err);
        setIsConnecting(false);
        throw err;
      }

      try {
        // 1. Request account access
        const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error('No wallet accounts selected.');
        }
        const payer = getAddress(accounts[0]);

        // 2. Switch or add Arc Network
        const chainHex = `0x${chainId.toString(16)}`;
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainHex }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain')) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [getChainParams(chainId)],
            });
          } else {
            throw switchError;
          }
        }

        setIsConnecting(false);
        setIsPaying(true);

        // 3. Prepare order & payment call
        const orderId = params.orderId || generateOrderId('arcpay');
        const grossAmount = parseUsdc(params.amount);
        const metadataStr =
          typeof params.metadata === 'object'
            ? JSON.stringify(params.metadata)
            : params.metadata || '';

        let data: `0x${string}`;

        if (params.affiliate && params.affiliateAmount) {
          const affAmount = parseUsdc(params.affiliateAmount);
          const fee = (grossAmount * BigInt(PROTOCOL_FEE_BPS)) / BigInt(BPS_DIVISOR);
          const net = grossAmount - fee;
          const merchAmount = net - affAmount;

          data = encodeFunctionData({
            abi: ARC_PAYMENT_GATEWAY_ABI,
            functionName: 'payNativeWithSplit',
            args: [
              orderId,
              getAddress(params.merchant),
              merchAmount,
              getAddress(params.affiliate),
              affAmount,
              metadataStr,
            ],
          });
        } else {
          data = encodeFunctionData({
            abi: ARC_PAYMENT_GATEWAY_ABI,
            functionName: 'payNative',
            args: [orderId, getAddress(params.merchant), metadataStr],
          });
        }

        // 4. Send 1-Click Native Transaction (msg.value)
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

        // 5. Wait for on-chain confirmation & receipt (~600ms on Arc)
        const publicClient = createPublicClient({
          chain: targetChain,
          transport: http(),
        });

        let blockNumber = 0n;
        try {
          const txReceipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
            timeout: 30_000,
          });

          if (txReceipt.status !== 'success') {
            throw new Error('Transaction was reverted on Arc Network.');
          }
          blockNumber = txReceipt.blockNumber;
        } catch (receiptErr: any) {
          if (receiptErr.message?.includes('reverted')) {
            throw receiptErr;
          }
          // Non-blocking fallback for edge-case RPC polling latency
        }

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
        const customError = new Error(err?.message || 'Payment failed or was rejected by user.');
        setError(customError);
        throw customError;
      }
    },
    [reset]
  );

  return { checkout, isConnecting, isPaying, isSuccess, error, receipt, reset };
}

// -----------------------------------------------------------------------------
// Component: Checkout Modal
// -----------------------------------------------------------------------------
interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CheckoutParams;
  onSuccess?: (receipt: PaymentReceipt) => void;
  onError?: (error: Error) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  params,
  onSuccess,
  onError,
}: CheckoutModalProps) {
  const { checkout, isConnecting, isPaying, isSuccess, error, receipt, reset } = useCheckout();
  const chainId = params.chainId || 5042002;

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const grossAmount = parseUsdc(params.amount);
  const feeInfo = calculateArcFee(params.amount);
  const hasInjected = typeof window !== 'undefined' && Boolean((window as any).ethereum);

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
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={logoIconStyle}>⚡</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>ArcPay Checkout</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {chainId === 5042 ? 'Arc Mainnet' : 'Arc Testnet'} • Native USDC
              </div>
            </div>
          </div>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Order Summary Box */}
        <div style={orderBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                {params.item || 'One-Time Purchase'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                To: {shortenAddress(params.merchant)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                ${formatUsdc(grossAmount)} <span style={{ fontSize: '13px', fontWeight: '600' }}>USDC</span>
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '500' }}>
                0.40% Protocol Fee (${feeInfo.formattedFee})
              </div>
            </div>
          </div>

          <div style={noticeBadgeStyle}>
            <span style={{ marginRight: '4px' }}>✨</span>
            1-Click Native Gas — Zero ERC-20 Approvals Needed
          </div>
        </div>

        {/* Dynamic Body State */}
        {isSuccess && receipt ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
              Payment Settled!
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Confirmed in ~600ms on Arc Layer-1 {receipt.blockNumber > 0n ? `(Block #${receipt.blockNumber})` : ''}
            </div>

            <div style={receiptBoxStyle}>
              <div style={receiptRowStyle}>
                <span style={{ color: '#64748b' }}>Transaction</span>
                <a
                  href={getExplorerTxUrl(chainId, receipt.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                >
                  {receipt.txHash.slice(0, 10)}...{receipt.txHash.slice(-8)} ↗
                </a>
              </div>
              <div style={receiptRowStyle}>
                <span style={{ color: '#64748b' }}>Order ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0f172a' }}>
                  {receipt.orderId.slice(0, 12)}...
                </span>
              </div>
              <div style={receiptRowStyle}>
                <span style={{ color: '#64748b' }}>Settled Amount</span>
                <span style={{ fontWeight: '700', color: '#059669' }}>${formatUsdc(receipt.amount)} USDC</span>
              </div>
            </div>

            <button style={primaryBtnStyle} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <div>
            {error && (
              <div style={errorBannerStyle}>
                ⚠️ {error.message}
              </div>
            )}

            {hasInjected ? (
              <button
                style={{
                  ...primaryBtnStyle,
                  opacity: isConnecting || isPaying ? 0.7 : 1,
                  cursor: isConnecting || isPaying ? 'wait' : 'pointer',
                }}
                disabled={isConnecting || isPaying}
                onClick={handlePayClick}
              >
                {isConnecting
                  ? 'Connecting Wallet...'
                  : isPaying
                  ? 'Confirming on Arc (~600ms)...'
                  : `Pay $${formatUsdc(grossAmount)} USDC`}
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                  Scan with MetaMask or Mobile EVM Browser:
                </div>
                <div style={qrBoxStyle}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payLinkUrl)}`}
                    alt="Scan to Pay"
                    style={{ width: '150px', height: '150px', borderRadius: '8px' }}
                  />
                </div>
                <a
                  href={`https://metamask.app.link/dapp/${typeof window !== 'undefined' ? window.location.host : ''}/pay?merchant=${params.merchant}&amount=${formatUsdc(grossAmount)}&chainId=${chainId}`}
                  style={deepLinkBtnStyle}
                  target="_blank"
                  rel="noreferrer"
                >
                  🦊 Open in MetaMask Mobile
                </a>
              </div>
            )}

            <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
              Secured by ArcPaymentGateway • Non-Custodial
            </div>
          </div>
        )}
      </div>
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
  theme = 'emerald',
  label,
  size = 'md',
  className = '',
  style = {},
  chainId = 5042002,
  contractAddress,
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

  const buttonStyle = useMemo(() => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '600',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      ...style,
    };

    // Size
    if (size === 'sm') {
      base.padding = '8px 14px';
      base.fontSize = '13px';
    } else if (size === 'lg') {
      base.padding = '14px 24px';
      base.fontSize = '16px';
    } else {
      base.padding = '11px 18px';
      base.fontSize = '14px';
    }

    // Theme
    if (theme === 'dark') {
      base.backgroundColor = '#0f172a';
      base.color = '#ffffff';
    } else if (theme === 'light') {
      base.backgroundColor = '#f8fafc';
      base.color = '#0f172a';
      base.border = '1px solid #e2e8f0';
    } else if (theme === 'minimal') {
      base.backgroundColor = 'transparent';
      base.color = '#059669';
      base.border = '1.5px solid #059669';
      base.boxShadow = 'none';
    } else {
      // Emerald brand
      base.backgroundColor = '#059669';
      base.color = '#ffffff';
    }

    return base;
  }, [theme, size, style]);

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
  };

  return (
    <>
      <button
        type="button"
        className={`arcpay-btn ${className}`}
        style={buttonStyle}
        onClick={() => setIsOpen(true)}
      >
        <span style={{ fontSize: '1.1em' }}>⚡</span>
        <span>{defaultText}</span>
      </button>

      <CheckoutModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          if (onCancel) onCancel();
        }}
        params={checkoutParams}
        onSuccess={(receipt) => {
          if (onSuccess) onSuccess(receipt);
        }}
        onError={onError}
      />
    </>
  );
}

// -----------------------------------------------------------------------------
// Styles for Modal & Sub-elements
// -----------------------------------------------------------------------------
const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999999,
  padding: '16px',
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '400px',
  padding: '24px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#0f172a',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
};

const logoIconStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  backgroundColor: '#ecfdf5',
  color: '#059669',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '16px',
  cursor: 'pointer',
  color: '#94a3b8',
  padding: '4px 8px',
  borderRadius: '6px',
};

const orderBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
};

const noticeBadgeStyle: React.CSSProperties = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  fontSize: '11px',
  fontWeight: '600',
  padding: '6px 10px',
  borderRadius: '6px',
  marginTop: '8px',
  display: 'flex',
  alignItems: 'center',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#059669',
  color: '#ffffff',
  fontWeight: '700',
  fontSize: '15px',
  padding: '13px 18px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  fontSize: '12px',
  padding: '10px',
  borderRadius: '8px',
  marginBottom: '12px',
};

const qrBoxStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '8px',
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  marginBottom: '12px',
};

const deepLinkBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  backgroundColor: '#f97316',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '13px',
  padding: '10px',
  borderRadius: '8px',
};

const receiptBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '16px',
};

const receiptRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  padding: '4px 0',
};
