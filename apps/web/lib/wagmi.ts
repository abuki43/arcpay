import { http, fallback } from 'viem';
import { createConfig } from 'wagmi';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { arcTestnet, arcMainnet } from '@arcpay/sdk';

const testnetSources = [
  arcTestnet.rpcUrls.default.http[0],
  process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL,
].filter((url): url is string => Boolean(url));

const mainnetSources = [
  arcMainnet.rpcUrls.default.http[0],
  process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL,
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
    // Public Arc endpoint is primary (Alchemy's Free tier caps eth_getLogs at a
    // 10-block range, so it can't serve our backfill); the Alchemy endpoint from
    // env acts as the fallback for reads / checkout receipts when the public
    // node errors or times out.
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