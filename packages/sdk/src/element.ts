import { getAddress, encodeFunctionData, createPublicClient, fallback, http } from 'viem';
import QRCode from 'qrcode';
import { ARC_PAYMENT_GATEWAY_ABI } from './abi';
import { DEFAULT_CHAIN_ID, DEFAULT_GATEWAY_ADDRESSES, SUPPORTED_CHAINS, arcMainnet, PROTOCOL_FEE_BPS, BPS_DIVISOR } from './constants';
import { generateOrderId, parseUsdc, formatUsdc } from './utils';
import { discoverWallet, switchToChain } from './wallet';
import { humanizeCheckoutError } from './errors';

/** Generous per-request timeout; public Arc endpoints can stall under load. */
const RPC_TIMEOUT_MS = 20_000;

/**
 * Total budget for confirming a receipt. Arc produces a block every ~600ms,
 * so the window only needs to outlive a lagging RPC node's indexing delay.
 */
const RECEIPT_CONFIRM_TIMEOUT_MS = 60_000;

// SSR-safe base class
const CustomElementBase: { new (): HTMLElement } =
  typeof HTMLElement !== 'undefined'
    ? HTMLElement
    : (class {} as unknown as { new (): HTMLElement });

/**
 * Universal Web Component: <arc-pay-button>
 * Can be embedded in HTML, Webflow, Shopify, WordPress, or Vanilla JS.
 *
 * Visual theme defaults to "instrument" — dark canvas, hairline borders,
 * Signal Amber accent. The web component reads CSS custom properties from
 * the host page so it adapts to the host design system:
 *   --arcpay-canvas, --arcpay-surface, --arcpay-raised, --arcpay-line,
 *   --arcpay-ink, --arcpay-ink-2, --arcpay-ink-3, --arcpay-accent
 *
 * Usage:
 * <arc-pay-button merchant="0x..." amount="29.00" item="Pro Plan" contract-address="0x..."></arc-pay-button>
 */
export class ArcPayButtonElement extends CustomElementBase {
  static get observedAttributes() {
    return ['merchant', 'amount', 'item', 'theme', 'chain-id', 'contract-address', 'metadata', 'rpc-url', 'affiliate', 'affiliate-amount'];
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
    const theme = this.getAttribute('theme') || 'instrument';
    // Guard the parse: a non-numeric chain-id would otherwise render "NaN"
    // in the modal subtitle.
    const parsedChainId = parseInt(this.getAttribute('chain-id') || '', 10);
    const chainId = Number.isFinite(parsedChainId) ? parsedChainId : DEFAULT_CHAIN_ID;

    const isInstr = theme === 'instrument' || theme === 'instrument-light';
    const isLight = theme === 'instrument-light';

    // Button surface (legacy themes keep their old colors)
    let btnBg = 'var(--arcpay-ink, #F0EFEC)';
    let btnColor = 'var(--arcpay-canvas, #0B0B0A)';
    let btnBorder = '1px solid transparent';

    if (theme === 'emerald') {
      btnBg = '#047857';
      btnColor = '#ffffff';
      btnBorder = 'none';
    } else if (theme === 'light') {
      btnBg = '#f8fafc';
      btnColor = '#0f172a';
      btnBorder = '1px solid #e2e8f0';
    } else if (theme === 'minimal') {
      btnBg = 'transparent';
      btnColor = '#047857';
      btnBorder = '1.5px solid #047857';
    } else if (theme === 'dark') {
      btnBg = '#0f172a';
      btnColor = '#ffffff';
      btnBorder = 'none';
    } else if (isLight) {
      btnBg = 'var(--arcpay-canvas, #0B0B0A)';
      btnColor = 'var(--arcpay-ink, #F0EFEC)';
      btnBorder = '1px solid var(--arcpay-line, #2A2A29)';
    } // 'instrument' is the default above

    // CSS variable fallbacks — these mirror packages/sdk/src/react.tsx T constant
    this.shadow.innerHTML = `
      <style>
        :host {
          --_canvas:    var(--arcpay-canvas, #0B0B0A);
          --_surface:   var(--arcpay-surface, #141413);
          --_raised:    var(--arcpay-raised, #1C1C1B);
          --_line:      var(--arcpay-line, #2A2A29);
          --_ink:       var(--arcpay-ink, #F0EFEC);
          --_ink2:      var(--arcpay-ink-2, #B0AEA9);
          --_ink3:      var(--arcpay-ink-3, #8D8B86);
          --_accent:    var(--arcpay-accent, #F5A524);
          --_danger:    #E5484D;
          --_radius:    6px;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        *, *::before, *::after { box-sizing: border-box; }
        .arc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: ${btnBg};
          color: ${btnColor};
          border: ${btnBorder};
          padding: 9px 16px;
          border-radius: var(--_radius);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
          user-select: none;
          font-family: inherit;
        }
        .arc-btn:hover { opacity: 0.9; }
        .arc-btn:active { transform: scale(0.98); }
        .arc-btn:disabled { opacity: 0.6; cursor: wait; }
        .arc-btn svg { display: block; }

        .arc-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: ${isInstr ? 'rgba(11, 11, 10, 0.85)' : 'rgba(15, 23, 42, 0.65)'};
          backdrop-filter: ${isInstr ? 'blur(12px)' : 'blur(4px)'};
          -webkit-backdrop-filter: ${isInstr ? 'blur(12px)' : 'blur(4px)'};
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 16px;
        }
        .arc-modal-backdrop.open { display: flex; }

        .arc-modal-card {
          background: ${isInstr ? (isLight ? '#FFFFFF' : 'var(--_surface)') : '#ffffff'};
          ${isInstr
            ? `border: 1px solid var(--_line);
               color: ${isLight ? '#0B0B0A' : 'var(--_ink)'};
               box-shadow: none;`
            : `border: none;
               color: #0f172a;
               box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);`}
          border-radius: 8px;
          width: 100%;
          max-width: 400px;
          padding: 20px;
          position: relative;
          font-family: inherit;
        }

        .arc-modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: transparent;
          border: 1px solid ${isInstr ? 'var(--_line)' : '#e2e8f0'};
          color: ${isInstr ? (isLight ? '#5C5A55' : 'var(--_ink3)') : '#94a3b8'};
          padding: 4px 8px;
          font-size: 11px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          text-transform: lowercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          border-radius: 4px;
        }

        .arc-modal-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-right: 60px;
        }
        .arc-modal-logo {
          width: 28px; height: 28px;
          border-radius: 6px;
          background: var(--_accent);
          color: var(--_canvas);
          display: flex; align-items: center; justify-content: center;
        }
        .arc-modal-title { font-size: 13px; font-weight: 600; line-height: 1.2; }
        .arc-modal-subtitle {
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: ${isInstr ? (isLight ? '#5C5A55' : 'var(--_ink3)') : '#64748b'};
          margin-top: 3px;
        }

        .arc-modal-order {
          background: ${isInstr ? (isLight ? '#F4F2EB' : 'var(--_raised)') : '#f8fafc'};
          border: 1px solid ${isInstr ? 'var(--_line)' : '#e2e8f0'};
          border-radius: 6px;
          padding: 14px 16px;
          margin-bottom: 12px;
        }
        .arc-modal-order-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }
        .arc-modal-item { font-size: 13px; font-weight: 500; min-width: 0; }
        .arc-modal-merchant {
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: ${isInstr ? (isLight ? '#5C5A55' : 'var(--_ink3)') : '#64748b'};
          margin-top: 3px;
          letter-spacing: 0.02em;
        }
        .arc-modal-amount {
          font-size: 22px;
          font-weight: 600;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: -0.02em;
          line-height: 1;
          color: ${isInstr ? (isLight ? '#0B0B0A' : 'var(--_ink)') : '#0f172a'};
        }
        .arc-modal-amount-suffix {
          font-size: 11px;
          font-weight: 500;
          color: ${isInstr ? (isLight ? '#5C5A55' : 'var(--_ink3)') : '#64748b'};
          margin-left: 4px;
          letter-spacing: 0.06em;
        }
        .arc-modal-fee {
          font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: ${isInstr ? (isLight ? '#5C5A55' : 'var(--_ink3)') : '#64748b'};
          margin-top: 4px;
          letter-spacing: 0.02em;
        }

        .arc-modal-qr {
          display: flex;
          justify-content: center;
          padding: 8px;
          background: ${isInstr ? (isLight ? '#F4F2EB' : 'var(--_raised)') : '#f8fafc'};
          border: 1px solid ${isInstr ? 'var(--_line)' : '#e2e8f0'};
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .arc-modal-qr img { width: 150px; height: 150px; border-radius: 4px; }

        .arc-modal-deeplink {
          display: block;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
          background: transparent;
          color: ${isInstr ? (isLight ? '#0B0B0A' : 'var(--_ink)') : '#047857'};
          border: ${isInstr ? '1.5px solid ' + (isLight ? '#0B0B0A' : 'var(--_line)') : '1.5px solid #047857'};
          text-decoration: none;
          font-weight: 500;
          font-size: 12px;
          padding: 10px 12px;
          border-radius: 6px;
        }

        .arc-modal-foot {
          margin-top: 12px;
          text-align: center;
          font-size: 10px;
          color: ${isInstr ? (isLight ? '#5C5A55' : 'var(--_ink3)') : '#94a3b8'};
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        @keyframes arcpay-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.65); }
        }
        @media (prefers-reduced-motion: reduce) {
          .arc-btn:active { transform: none; }
        }
      </style>

      <button class="arc-btn" id="pay-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span>Pay $${amount} USDC</span>
      </button>

      <div class="arc-modal-backdrop" id="fallback-modal" role="dialog" aria-modal="true" aria-label="ArcPay checkout">
        <div class="arc-modal-card">
          <button class="arc-modal-close" id="modal-close-btn" aria-label="Close">esc</button>
          <div class="arc-modal-header">
            <div class="arc-modal-logo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
              <div class="arc-modal-title">ArcPay checkout</div>
              <div class="arc-modal-subtitle">${chainId === 5042 ? 'Arc mainnet' : 'Arc testnet'} · ${chainId} · native USDC</div>
            </div>
          </div>
          <div class="arc-modal-order">
            <div class="arc-modal-order-row">
              <div style="min-width:0;flex:1;padding-right:12px;">
                <div class="arc-modal-item">${item}</div>
                <div class="arc-modal-merchant">to ${merchant ? merchant.slice(0, 6) + '…' + merchant.slice(-4) : ''}</div>
              </div>
              <div style="text-align:right;">
                <div class="arc-modal-amount">$${amount}<span class="arc-modal-amount-suffix">USDC</span></div>
                <div class="arc-modal-fee">fee 0.40%</div>
              </div>
            </div>
           <div class="arc-modal-qr">
             <img id="qr-img" src="" alt="Scan to Pay" />
           </div>
           <a id="metamask-link" class="arc-modal-deeplink" target="_blank" rel="noreferrer">
             Open in MetaMask mobile
           </a>
           <div class="arc-modal-foot">Secured by ArcPaymentGateway · Non-custodial</div>
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
        modal.classList.remove('open');
      };
    }
    // ESC key support
    if (modal) {
      modal.onkeydown = (e: any) => {
        if (e.key === 'Escape') modal.classList.remove('open');
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
    const chainId = parseInt(this.getAttribute('chain-id') || String(DEFAULT_CHAIN_ID), 10);
    const customContract = this.getAttribute('contract-address');
    const rpcUrl = this.getAttribute('rpc-url') || undefined;
    const affiliate = this.getAttribute('affiliate');
    const affiliateAmount = this.getAttribute('affiliate-amount');

    if (!merchant || !amount) {
      this.dispatchEvent(new CustomEvent('arcpay:error', { detail: { message: 'Missing merchant or amount attribute' } }));
      return;
    }

    const ethereum = await discoverWallet();
    const targetChain = SUPPORTED_CHAINS[chainId] || arcMainnet;

    if (!ethereum) {
      const payUrl = `${window.location.origin}/pay?merchant=${merchant}&amount=${amount}&item=${encodeURIComponent(item)}&chainId=${chainId}`;
      if (qrImg) {
        const dataUrl = await QRCode.toDataURL(payUrl, { width: 160, margin: 1 });
        qrImg.src = dataUrl;
      }
      if (mmLink) mmLink.href = `https://metamask.app.link/dapp/${window.location.host}/pay?merchant=${merchant}&amount=${amount}&chainId=${chainId}`;
      if (modal) {
        modal.classList.add('open');
        const firstFocus = modal.querySelector('button, a') as HTMLElement | null;
        firstFocus?.focus();
      }
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.querySelector('span')!.textContent = 'Connecting…';
      }

      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
      const payer = getAddress(accounts[0]);

      await switchToChain(ethereum, chainId, rpcUrl);

      if (btn) btn.querySelector('span')!.textContent = 'Confirming on Arc (~600ms)…';

      const orderId = generateOrderId('arcpay');
      const grossAmount = parseUsdc(amount);
      if (grossAmount === 0n) {
        throw new Error('Payment amount must be greater than 0.');
      }
      const gatewayAddress =
        (customContract as `0x${string}`) ||
        DEFAULT_GATEWAY_ADDRESSES[chainId] ||
        DEFAULT_GATEWAY_ADDRESSES[DEFAULT_CHAIN_ID];

      let data: `0x${string}`;
      let functionName: 'payNative' | 'payNativeWithSplit';
      let args: readonly [`0x${string}`, `0x${string}`, string] | readonly [`0x${string}`, `0x${string}`, bigint, `0x${string}`, bigint, string];

      if (affiliate && affiliateAmount) {
        const affAmount = parseUsdc(affiliateAmount);
        if (affAmount === 0n) {
          throw new Error('Affiliate amount must be greater than 0.');
        }
        const fee = (grossAmount * BigInt(PROTOCOL_FEE_BPS)) / BigInt(BPS_DIVISOR);
        const net = grossAmount - fee;
        const merchAmount = net - affAmount;

        functionName = 'payNativeWithSplit';
        args = [orderId, getAddress(merchant), merchAmount, getAddress(affiliate), affAmount, metadataStr];
      } else {
        functionName = 'payNative';
        args = [orderId, getAddress(merchant), metadataStr];
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

      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: payer,
          to: gatewayAddress,
          value: `0x${grossAmount.toString(16)}`,
          data,
        }],
      });

      // An unseen receipt means unknown, not failed: the tx may already be
      // mined while the node lags. Never report that as a revert, or the user
      // may retry and pay twice.
      let receipt;
      try {
        receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: RECEIPT_CONFIRM_TIMEOUT_MS,
        });
      } catch (receiptErr: any) {
        const name = receiptErr?.name || '';
        if (
          name === 'TransactionReceiptNotFoundError' ||
          name === 'WaitForTransactionReceiptTimeoutError'
        ) {
          const probed = await publicClient
            .getTransactionReceipt({ hash: txHash })
            .catch(() => null);

          if (!probed) {
            const pending = new Error(
              `Still confirming on Arc. Your payment was submitted (tx ${txHash}) — check the explorer before paying again.`,
            );
            (pending as any).isPendingConfirmation = true;
            if (btn) btn.querySelector('span')!.textContent = 'Confirming…';
            this.dispatchEvent(new CustomEvent('arcpay:pending', {
              detail: { txHash },
            }));
            throw pending;
          }
          receipt = probed;
        } else {
          throw receiptErr;
        }
      }

      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted on Arc.');
      }

      const blockNumber = receipt.blockNumber;

      if (btn) btn.querySelector('span')!.textContent = 'Paid!';

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
        btn.querySelector('span')!.textContent = `Pay $${amount} USDC`;
      }
      // Keep the full provider/viem detail for debugging; surface short copy.
      console.error('[arcpay] checkout failed:', err);
      const humanError = humanizeCheckoutError(err);
      this.dispatchEvent(new CustomEvent('arcpay:error', {
        detail: { error: humanError, message: humanError.message, cause: err },
      }));
    }
  }
}

// Auto-register custom element if in browser
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('arc-pay-button')) {
  customElements.define('arc-pay-button', ArcPayButtonElement);
}
