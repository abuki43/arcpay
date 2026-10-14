import type { Chain } from 'viem';
import { arcTestnet, arcMainnet } from './constants';

export interface Eip6963ProviderInfo {
  rdns: string;
  name: string;
  icon: string;
}

export interface Eip6963Provider {
  info: Eip6963ProviderInfo;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

export async function discoverWallet(): Promise<Eip6963Provider | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve((window as any).ethereum ?? null);
      }
    }, 500);

    const handler = (event: any) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      const provider = event.detail?.provider ?? event.detail ?? null;
      if (provider && typeof provider.request === 'function') {
        resolve(provider);
      } else {
        resolve((window as any).ethereum ?? null);
      }
    };

    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  });
}

export async function switchToChain(
  ethereum: any,
  chainId: number,
  rpcUrl?: string,
): Promise<void> {
  const chain: Chain = chainId === 5042 ? arcMainnet : arcTestnet;
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
        params: [{
          chainId: chainHex,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [rpcUrl || chain.rpcUrls.default.http[0]],
          blockExplorerUrls: [chain.blockExplorers?.default.url],
        }],
      });
    } else {
      throw switchError;
    }
  }
}
