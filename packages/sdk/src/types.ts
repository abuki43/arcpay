import type { Address, Hash } from 'viem';

/**
 * On-chain PaymentRecord struct representation
 */
export interface PaymentRecord {
  orderId: `0x${string}`;
  merchant: Address;
  payer: Address;
  token: Address;
  amount: bigint;
  protocolFee: bigint;
  timestamp: bigint;
  isSettled: boolean;
  metadata: string;
}

/**
 * Parameters for initiating checkout
 */
export interface CheckoutParams {
  /** Merchant recipient wallet address */
  merchant: Address;
  /** Gross USDC amount (e.g. 29.00 or "29.00" or bigint in 18 decimals) */
  amount: number | string | bigint;
  /** Product or item name (e.g. "CloudAI Pro") */
  item?: string;
  /** Custom metadata (JSON object or string) */
  metadata?: Record<string, any> | string;
  /** Optional affiliate / platform split recipient */
  affiliate?: Address;
  /** Amount routed to affiliate (in USDC or bigint) */
  affiliateAmount?: number | string | bigint;
  /**
   * Optional unique 32-byte order ID.
   * By default, the SDK auto-generates a unique cryptographic bytes32 ID per checkout attempt
   * to guarantee replay protection on retries and renewals.
   */
  orderId?: `0x${string}`;
  /** Target Chain ID (default 5042002 for Arc Testnet, 5042 for Arc Mainnet) */
  chainId?: number;
  /** Custom gateway contract address override */
  contractAddress?: Address;
  /** Custom RPC URL override (e.g. an Alchemy Arc endpoint). Defaults to the chain's public endpoint. */
  rpcUrl?: string;
}

/**
 * Successful payment settlement receipt
 */
export interface PaymentReceipt {
  orderId: `0x${string}`;
  txHash: Hash;
  merchant: Address;
  payer: Address;
  amount: bigint;
  protocolFee: bigint;
  timestamp: number;
  blockNumber: bigint;
  metadata: string;
}

/**
 * Parameters for server-side verification
 */
export interface VerifyPaymentParams {
  /** 32-byte order ID to verify */
  orderId: `0x${string}`;
  /** Expected merchant wallet */
  merchant: Address;
  /** Expected minimum amount (in USDC decimal or bigint) */
  expectedAmount?: number | string | bigint;
  /** Maximum acceptable age of settlement in seconds (e.g. 3600 for 1 hour) */
  maxAgeSeconds?: number;
  /** Arc Chain ID (default 5042002 for Testnet, 5042 for Mainnet) */
  chainId?: number;
  /** Custom RPC URL override */
  rpcUrl?: string;
  /** Custom gateway contract address override */
  contractAddress?: Address;
}

/**
 * Server verification result
 */
export interface VerificationResult {
  isValid: boolean;
  isSettled: boolean;
  orderId: `0x${string}`;
  merchant: Address;
  payer?: Address;
  amount?: bigint;
  formattedAmount?: string;
  protocolFee?: bigint;
  timestamp?: number;
  txHash?: Hash;
  blockNumber?: bigint;
  metadata?: any;
  error?: string;
}

/**
 * UI Theme options for ArcPayButton
 */
export type ArcPayTheme = 'emerald' | 'dark' | 'light' | 'minimal';

/**
 * ArcPayButton Component Props
 */
export interface ArcPayButtonProps {
  /** Merchant recipient wallet address */
  merchant: Address;
  /** Price in USDC (e.g. 29.00 or "29.00") */
  amount: number | string | bigint;
  /** Item description or plan name */
  item?: string;
  /** Metadata to attach to payment */
  metadata?: Record<string, any> | string;
  /** Optional affiliate recipient */
  affiliate?: Address;
  /** Optional affiliate amount */
  affiliateAmount?: number | string | bigint;
  /** Visual theme */
  theme?: ArcPayTheme;
  /** Button label text override (default: "Pay with Arc") */
  label?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Extra CSS classes */
  className?: string;
  /** Extra inline styles */
  style?: Record<string, any>;
  /** Target Chain ID (default 5042002) */
  chainId?: number;
  /** Custom contract address override */
  contractAddress?: Address;
  /** Custom RPC URL override (e.g. an Alchemy Arc endpoint). Defaults to the chain's public endpoint. */
  rpcUrl?: string;
  /** Callback triggered on verified payment */
  onSuccess?: (receipt: PaymentReceipt) => void;
  /** Callback triggered on transaction error */
  onError?: (error: Error) => void;
  /** Callback triggered when user cancels */
  onCancel?: () => void;
}
