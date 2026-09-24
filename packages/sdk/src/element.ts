import { getAddress, encodeFunctionData, createPublicClient, http } from 'viem';
import { ARC_PAYMENT_GATEWAY_ABI } from './abi';
import { DEFAULT_GATEWAY_ADDRESSES, SUPPORTED_CHAINS, arcTestnet, arcMainnet } from './constants';
import { generateOrderId, parseUsdc, formatUsdc } from './utils';

// SSR-safe base class
const CustomElementBase: { new (): HTMLElement } =
  typeof HTMLElement !== 'undefined'
    ? HTMLElement
    : (class {} as unknown as { new (): HTMLElement });

/**
 * Universal Web Component: <arc-pay-button>
 * Can be embedded in HTML, Webflow, Shopify, WordPress, or Vanilla JS.
 *
 * Usage:
 * <arc-pay-button merchant="0x..." amount="29.00" item="Pro Plan" contract-address="0x..."></arc-pay-button>
 */
export class ArcPayButtonElement extends CustomElementBase {
  static get observedAttributes() {
    return ['merchant', 'amount', 'item', 'theme', 'chain-id', 'contract-address', 'metadata'];
  }

  private shadow?: ShadowRoot;

  constructor() {
    super();
    if (typeof this.attachShadow === 'function') {
      this.shadow = this.attachShadow({ mode: 'open' });
    }
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private render() {
    if (!this.shadow) return;

    const merchant = this.getAttribute('merchant') || '';
    const amount = this.getAttribute('amount') || '0';
    const item = this.getAttribute('item') || 'One-Time Purchase';
    const theme = this.getAttribute('theme') || 'emerald';

    let bg = '#059669';
    let color = '#ffffff';
    let border = 'none';

    if (theme === 'dark') {
      bg = '#0f172a';
    } else if (theme === 'light') {
      bg = '#f8fafc';
      color = '#0f172a';
      border = '1px solid #e2e8f0';
    } else if (theme === 'minimal') {
      bg = 'transparent';
      color = '#059669';
      border = '1.5px solid #059669';
    }

    this.shadow.innerHTML = `
      <style>
        .arc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: ${bg};
          color: ${color};
          border: ${border};
          padding: 10px 18px;
          border-radius: 10px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.15s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          user-select: none;
        }
        .arc-btn:hover {
          opacity: 0.92;
        }
        .arc-btn:active {
          transform: scale(0.98);
        }
        .arc-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .arc-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 16px;
        }
        .arc-modal-card {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 380px;
          padding: 24px;
          color: #0f172a;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          text-align: center;
          position: relative;
        }
        .arc-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #94a3b8;
        }
      </style>
      <button class="arc-btn" id="pay-btn" type="button">
        <span>⚡</span>
        <span>Pay $${amount} USDC</span>
      </button>

      <div class="arc-modal-backdrop" id="fallback-modal">
        <div class="arc-modal-card">
          <button class="arc-modal-close" id="modal-close-btn">✕</button>
          <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">Pay with Arc Network</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">Scan with MetaMask or Mobile EVM Browser</div>
          
          <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <img id="qr-img" src="" alt="Scan QR" style="width: 160px; height: 160px; border-radius: 8px; border: 1px solid #e2e8f0;" />
          </div>

          <a id="metamask-link" href="" target="_blank" style="display: block; width: 100%; background: #f97316; color: white; text-decoration: none; font-weight: 600; padding: 12px; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
            🦊 Open in MetaMask Mobile
          </a>
        </div>
      </div>
    `;

    const btn = this.shadow.getElementById('pay-btn');
    if (btn) {
      btn.onclick = () => this.handlePayment();
    }

    const closeBtn = this.shadow.getElementById('modal-close-btn');
    const modal = this.shadow.getElementById('fallback-modal');
    if (closeBtn && modal) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }
  }

  private async handlePayment() {
    if (!this.shadow) return;
    const btn = this.shadow.getElementById('pay-btn') as HTMLButtonElement | null;
    const modal = this.shadow.getElementById('fallback-modal') as HTMLElement | null;
    const qrImg = this.shadow.getElementById('qr-img') as HTMLImageElement | null;
    const mmLink = this.shadow.getElementById('metamask-link') as HTMLAnchorElement | null;

    const merchant = this.getAttribute('merchant');
    const amount = this.getAttribute('amount');
    const item = this.getAttribute('item') || 'Order';
    const metadataStr = this.getAttribute('metadata') || '';
    const chainId = parseInt(this.getAttribute('chain-id') || '5042002', 10);
    const customContract = this.getAttribute('contract-address');

    if (!merchant || !amount) {
      this.dispatchEvent(new CustomEvent('arcpay:error', { detail: { message: 'Missing merchant or amount attribute' } }));
      return;
    }

    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
    const targetChain = SUPPORTED_CHAINS[chainId] || arcTestnet;

    // Mobile fallback modal if no injected wallet found
    if (!ethereum) {
      const payUrl = `${window.location.origin}/pay?merchant=${merchant}&amount=${amount}&item=${encodeURIComponent(item)}&chainId=${chainId}`;
      if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payUrl)}`;
      if (mmLink) mmLink.href = `https://metamask.app.link/dapp/${window.location.host}/pay?merchant=${merchant}&amount=${amount}&chainId=${chainId}`;
      if (modal) modal.style.display = 'flex';
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Connecting...';
      }

      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
      const payer = getAddress(accounts[0]);
      const chainHex = `0x${chainId.toString(16)}`;

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainHex }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainHex,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: [targetChain.rpcUrls.default.http[0]],
              blockExplorerUrls: [targetChain.blockExplorers?.default.url],
            }],
          });
        }
      }

      if (btn) btn.innerText = 'Confirming on Arc (~600ms)...';

      const orderId = generateOrderId('arcpay');
      const grossAmount = parseUsdc(amount);
      const gatewayAddress =
        (customContract as `0x${string}`) ||
        DEFAULT_GATEWAY_ADDRESSES[chainId] ||
        DEFAULT_GATEWAY_ADDRESSES[5042002];

      const data = encodeFunctionData({
        abi: ARC_PAYMENT_GATEWAY_ABI,
        functionName: 'payNative',
        args: [orderId, getAddress(merchant), metadataStr],
      });

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: payer,
          to: gatewayAddress,
          value: `0x${grossAmount.toString(16)}`,
          data,
        }],
      });

      // Wait for transaction receipt
      const publicClient = createPublicClient({
        chain: targetChain,
        transport: http(),
      });

      let blockNumber = 0n;
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 30_000,
        });
        if (receipt.status !== 'success') {
          throw new Error('Transaction reverted on Arc.');
        }
        blockNumber = receipt.blockNumber;
      } catch (rErr: any) {
        if (rErr.message?.includes('reverted')) throw rErr;
      }

      if (btn) btn.innerText = 'Paid! 🎉';

      this.dispatchEvent(new CustomEvent('arcpay:success', {
        detail: {
          orderId,
          txHash,
          merchant,
          payer,
          amount,
          blockNumber,
        },
      }));
    } catch (err: any) {
      if (btn) {
        btn.disabled = false;
        btn.innerText = `Pay $${amount} USDC`;
      }
      this.dispatchEvent(new CustomEvent('arcpay:error', { detail: { error: err } }));
    }
  }
}

// Auto-register custom element if in browser
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('arc-pay-button')) {
  customElements.define('arc-pay-button', ArcPayButtonElement);
}
