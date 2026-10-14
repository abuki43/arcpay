import { type Chain, defineChain } from 'viem';

/**
 * Arc Testnet Chain Definition (Circle Layer-1 Blockchain)
 * Chain ID: 5042002
 * Native Gas Currency: USDC (18 Decimals)
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://explorer.testnet.arc.io',
    },
  },
  testnet: true,
}) as Chain;

/**
 * Arc Mainnet Chain Definition
 * Chain ID: 5042
 * Native Gas Currency: USDC (18 Decimals)
 */
export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.arc.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://explorer.arc.io',
    },
  },
  testnet: false,
}) as Chain;

/**
 * Supported Arc Chains Map
 */
export const SUPPORTED_CHAINS: Record<number, Chain> = {
  5042002: arcTestnet,
  5042: arcMainnet,
};

/**
 * Protocol Fee Configuration
 */
export const PROTOCOL_FEE_BPS = 40; // 0.40%
export const MAX_FEE_BPS = 100; // 1.00%
export const BPS_DIVISOR = 10_000;
export const USDC_DECIMALS = 18;

/**
 * Known Deployment Addresses
 * (Defaults for Testnet and Mainnet)
 */
export const DEFAULT_GATEWAY_ADDRESSES: Record<number, `0x${string}`> = {
  5042002: '0xd35be28A0b54Dd4559494b2328E1Cb7C3f0318B7', // Default Arc Testnet Gateway
  5042: '0x0000000000000000000000000000000000000000',    // Staging Arc Mainnet Gateway
};

export const DEFAULT_CHAIN_ID = 5042002;
