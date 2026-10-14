import { http, fallback } from 'viem';
import { createConfig } from 'wagmi';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { arcTestnet, arcMainnet } from '@arcpay/sdk';

// Alchemy first: it has an SLA and survives browser traffic reliably, which
// the public Arc node does not always. The public endpoint stays as a fallback.
//
// The getLogs 10-block cap on Alchemy's free tier is irrelevant here — the web
// app never calls getLogs. Only the indexer needs wide ranges, and it runs in
// its own service against RPC_URL (the public node), not this config.
const testnetSources = [
  process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL,
  arcTestnet.rpcUrls.default.http[0],
].filter((url): url is string => Boolean(url));

const mainnetSources = [
  process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL,
  arcMainnet.rpcUrls.default.http[0],
].filter((url): url is string => Boolean(url));

// WalletConnect needs a Reown Cloud projectId. It is opt-in so the app still
// works without a Reown account — browser wallets and Coinbase are enough
// for checkout, WalletConnect only adds mobile QR.
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [arcMainnet, arcTestnet],
  connectors: [
    // `injected()` with no `target` picks up any EIP-1193 / EIP-6963 wallet
    // (Rabby, Brave, Frame, Coinbase extension, ...), not just MetaMask.
    injected(),
    coinbaseWallet({ appName: 'ArcPay' }),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId, showQrModal: true })]
      : []),
  ],
  transports: {
    [arcTestnet.id]: fallback(
      testnetSources.map((url) => http(url, { retryCount: 2 })),
      { retryCount: 1 }
    ),
    [arcMainnet.id]: fallback(
      mainnetSources.map((url) => http(url, { retryCount: 2 })),
      { retryCount: 1 }
    ),
  },
  ssr: true,
});