import { arcMainnet, arcTestnet } from '@arcpay/sdk';

export const ARC_MAINNET_ID = 5042;
export const ARC_TESTNET_ID = 5042002;

const SUPPORTED_APP_CHAIN_IDS = [ARC_MAINNET_ID, ARC_TESTNET_ID];

function resolveDefaultChainId(): number {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
  if (!raw) return ARC_MAINNET_ID;

  const parsed = Number(raw);
  if (!SUPPORTED_APP_CHAIN_IDS.includes(parsed)) {
    // Fail loudly rather than silently settling on the wrong network.
    throw new Error(
      `NEXT_PUBLIC_DEFAULT_CHAIN_ID must be one of ${SUPPORTED_APP_CHAIN_IDS.join(', ')} (got "${raw}")`,
    );
  }
  return parsed;
}

/**
 * The chain the app targets when a request does not specify one. Defaults to
 * Arc mainnet. Override with NEXT_PUBLIC_DEFAULT_CHAIN_ID=5042002 to run the
 * whole app against testnet without a code change.
 */
export const DEFAULT_APP_CHAIN_ID = resolveDefaultChainId();

export const IS_MAINNET_DEFAULT = DEFAULT_APP_CHAIN_ID === ARC_MAINNET_ID;

export const DEFAULT_APP_CHAIN =
  DEFAULT_APP_CHAIN_ID === ARC_MAINNET_ID ? arcMainnet : arcTestnet;

export const DEFAULT_CHAIN_LABEL = IS_MAINNET_DEFAULT ? 'Arc Mainnet' : 'Arc Testnet';

export const DEFAULT_EXPLORER_URL = IS_MAINNET_DEFAULT
  ? 'https://explorer.arc.io'
  : 'https://explorer.testnet.arc.io';

/**
 * Resolves the gateway for a chain, or throws instead of falling back to a
 * different network. Silently verifying a mainnet payment against the testnet
 * contract produces a misleading "not settled" error.
 */
export function resolveGatewayAddress(
  chainId: number,
  addresses: Record<number, `0x${string}`>,
): `0x${string}` {
  const address = addresses[chainId];
  if (!address || /^0x0+$/.test(address)) {
    throw new Error(
      `No ArcPaymentGateway deployment configured for chain ${chainId}. ` +
        'Deploy the contract or pass an explicit address.',
    );
  }
  return address;
}