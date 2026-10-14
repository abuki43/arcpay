import {
  type Address,
  formatUnits,
  keccak256,
  parseUnits,
  stringToBytes,
} from 'viem';
import { BPS_DIVISOR, PROTOCOL_FEE_BPS, SUPPORTED_CHAINS, USDC_DECIMALS, arcMainnet } from './constants';
import type { CheckoutParams } from './types';

/**
 * Generates a unique, cryptographically random 32-byte order identifier
 * @param prefix Optional string prefix (default: "arcpay")
 * @returns 32-byte hex string (`0x${string}`)
 */
export function generateOrderId(prefix: string = 'arcpay'): `0x${string}` {
  const entropy = [
    prefix,
    Date.now().toString(36),
    Math.random().toString(36).substring(2),
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
  ].join('_');

  return keccak256(stringToBytes(entropy));
}

/**
 * Parses a decimal number or string into 18-decimal native USDC bigint
 * Safely handles float precision by cleaning string representations.
 * @param amount Number, string, or bigint (e.g. 29.00 or "29.00")
 * @returns BigInt in 18 decimals
 */
export function parseUsdc(amount: number | string | bigint): bigint {
  if (typeof amount === 'bigint') {
    return amount;
  }
  let cleanStr: string;
  if (typeof amount === 'number') {
    // Avoid float precision artifacts like 0.30000000000000004
    cleanStr = amount.toFixed(6).replace(/\.?0+$/, '');
    if (cleanStr === '' || cleanStr === '.') cleanStr = '0';
  } else {
    cleanStr = amount.toString().trim();
  }
  return parseUnits(cleanStr, USDC_DECIMALS);
}

/**
 * Formats an 18-decimal bigint into a human-readable USDC decimal string
 * @param amount BigInt representation of USDC
 * @param maxFractionDigits Decimal places to display (default: 2)
 * @returns Formatted string (e.g. "29.00")
 */
export function formatUsdc(amount: bigint, maxFractionDigits: number = 2): string {
  const fullStr = formatUnits(amount, USDC_DECIMALS);
  const parts = fullStr.split('.');
  if (parts.length === 1) {
    return maxFractionDigits > 0 ? `${parts[0]}.${'0'.repeat(maxFractionDigits)}` : parts[0];
  }
  const decimals = parts[1].slice(0, maxFractionDigits).padEnd(maxFractionDigits, '0');
  return maxFractionDigits > 0 ? `${parts[0]}.${decimals}` : parts[0];
}

/**
 * Computes protocol fee breakdown for any gross amount
 * @param grossAmount Gross payment amount (number, string, or bigint)
 * @param feeBps Fee in basis points (default: 40 = 0.40%)
 */
export function calculateArcFee(
  grossAmount: number | string | bigint,
  feeBps: number = PROTOCOL_FEE_BPS
): {
  protocolFee: bigint;
  netAmount: bigint;
  formattedFee: string;
  formattedNet: string;
} {
  const gross = parseUsdc(grossAmount);
  const protocolFee = (gross * BigInt(feeBps)) / BigInt(BPS_DIVISOR);
  const netAmount = gross - protocolFee;

  return {
    protocolFee,
    netAmount,
    formattedFee: formatUsdc(protocolFee, 2),
    formattedNet: formatUsdc(netAmount, 2),
  };
}

/**
 * Returns block explorer transaction URL for any supported Arc chain
 * @param chainId Target Chain ID (5042 for Mainnet, 5042002 for Testnet)
 * @param txHash Transaction hash
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = SUPPORTED_CHAINS[chainId] || arcMainnet;
  const baseUrl = chain.blockExplorers?.default.url || 'https://explorer.arc.io';
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Constructs a shareable 1-Click PayLink URL
 * @param baseUrl Base application URL (e.g. "https://arcpay.network" or "http://localhost:3000")
 * @param params Checkout parameters
 * @returns Fully formatted URL
 */
export function createPayLinkUrl(
  baseUrl: string,
  params: {
    merchant: Address | string;
    amount: number | string;
    item?: string;
    metadata?: Record<string, any> | string;
    affiliate?: Address | string;
    affiliateAmount?: number | string;
    chainId?: number;
  }
): string {
  const url = new URL('/pay', baseUrl);
  url.searchParams.set('merchant', params.merchant);
  url.searchParams.set('amount', params.amount.toString());

  if (params.item) {
    url.searchParams.set('item', params.item);
  }
  if (params.affiliate && params.affiliateAmount) {
    url.searchParams.set('affiliate', params.affiliate);
    url.searchParams.set('affiliateAmount', params.affiliateAmount.toString());
  }
  if (params.chainId) {
    url.searchParams.set('chainId', params.chainId.toString());
  }
  if (params.metadata) {
    const metaStr =
      typeof params.metadata === 'string'
        ? params.metadata
        : JSON.stringify(params.metadata);
    url.searchParams.set('metadata', metaStr);
  }

  return url.toString();
}

/**
 * Parses checkout parameters from URL search query string
 * @param search Search query string or URL (e.g. window.location.search)
 */
export function parsePayLinkParams(search: string): Partial<CheckoutParams> {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);

  const merchant = params.get('merchant') as Address | null;
  const amountStr = params.get('amount');
  const item = params.get('item') || undefined;
  const affiliate = (params.get('affiliate') as Address) || undefined;
  const affiliateAmountStr = params.get('affiliateAmount') || undefined;
  const chainIdStr = params.get('chainId');
  const metadataRaw = params.get('metadata');

  let metadata: any = metadataRaw;
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      metadata = metadataRaw;
    }
  }

  return {
    merchant: merchant || undefined,
    amount: amountStr || '0',
    item,
    affiliate,
    affiliateAmount: affiliateAmountStr,
    chainId: chainIdStr ? parseInt(chainIdStr, 10) : undefined,
    metadata,
  };
}

/**
 * Shortens an EVM address for display
 * @param address Address to shorten
 * @param chars Visible chars at start and end (default: 4)
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
