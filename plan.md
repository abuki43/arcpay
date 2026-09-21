# Technical Implementation Plan: ArcPay

ArcPay is an open-source, developer-first payment protocol and embeddable checkout SDK purpose-built for the **Arc Network** (Circle's Layer-1 blockchain with native USDC gas and sub-second finality).

---

## 1. Executive Summary & Core Product Focus

ArcPay provides a Stripe/LemonSqueezy-like developer experience for Web3, allowing SaaS founders and digital creators to drop in a single checkout button (`<ArcPayButton />`) and accept USDC with **0.40% low protocol fees**, **~600ms deterministic settlement**, and **zero gas token friction**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ARCPAY SYSTEM TOPOLOGY                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

    [ SAAS WEBSITES & APPS ]           [ CREATORS & FREELANCERS ]      [ DEVELOPERS & APIS ]
    • Drop-in <ArcPayButton />         • No-Code PayLinks (/create)    • useCheckout() Hook
    • Demo Storefront (/store)         • Hosted Checkout (/pay)        • verifyArcPayment() Engine
               │                                   │                               │
               └───────────────────────────────────┼───────────────────────────────┘
                                                   ▼
                          ┌─────────────────────────────────────────────────┐
                          │       ARCPAY TYPESCRIPT SDK (@arcpay/sdk)       │
                          │  • <ArcPayButton /> (React Component + Modal)   │
                          │  • <arc-pay-button> (Universal Web Component)   │
                          │  • useCheckout() Headless React Hook            │
                          │  • verifyArcPayment() Server-Side RPC Engine    │
                          │  • Client Utils: createPayLinkUrl, parseUsdc    │
                          └─────────────────────────────────────────────────┘
                                                   │
                                                   ▼ JSON-RPC (Wagmi Injected)
                          ┌─────────────────────────────────────────────────┐
                          │       ARC NETWORK LAYER-1 (Circle Blockchain)   │
                          │  • Native Gas Token: USDC (18 Decimals)         │
                          │  • Sub-Second Finality: ~600ms                  │
                          │  • Testnet: 5042002  |  Mainnet: 5042           │
                          └─────────────────────────────────────────────────┘
                                                   │
                                                   ▼
                          ┌─────────────────────────────────────────────────┐
                          │       ArcPaymentGateway.sol (Smart Contract)    │
                          │  • 0.40% Protocol Fee Routing to Treasury       │
                          │  • 99.60% Instant Settlement to Merchant Wallet │
                          │  • Split Routing (Affiliates & Platforms)       │
                          │  • Order ID Hashing & Replay Protection         │
                          │  • Event Emission: PaymentSettled               │
                          └─────────────────────────────────────────────────┘
                                                   │
                                                   ▼ Wagmi useWatchContractEvent
                          ┌─────────────────────────────────────────────────┐
                          │       MERCHANT DASHBOARD (/dashboard)           │
                          │  • Zero-Database, 100% Client-Side Log Queries  │
                          │  • Real-Time Payment Feed & Volume Analytics    │
                          └─────────────────────────────────────────────────┘
```

---

## 2. Key Technical Decisions & Architecture Principles

### 2.1 Gas & Value Model: Pure Native USDC
* On Arc, **USDC is the native gas token**. Buyers pay for goods and transaction fees directly from their USDC balance.
* No paymasters, relayer infrastructure, or gas sponsorship needed. 1 USDC = 1 USD throughout the entire stack.
* **1-Click Checkout Advantage**: Unlike Ethereum/Base where USDC payments require two transactions (approve + transferFrom), Arc pays via `msg.value` in a **single native transaction**. The checkout modal must display: "Zero token approvals needed — pay in one click."

### 2.2 Wallet Connection: Wagmi Injected (Zero API Key Overhead)
* Uses Wagmi v2 `injected()` connector supporting all standard EVM browser wallets (MetaMask, Rabby, Brave Wallet, Coinbase Wallet extension, Phantom EVM, OKX).
* Avoids third-party WalletConnect Cloud project ID configuration, making `@arcpay/sdk` completely plug-and-play.

### 2.3 Event Monitoring: 100% Client-Side On-Chain Streaming
* The **Merchant Dashboard (`/dashboard`)** requires no backend server or Postgres database.
* Uses Wagmi's `useWatchContractEvent` for live incoming payments and `publicClient.getLogs` filtered by `merchant == connectedAddress` for historical sales.
* **getLogs Range Handling**: Public RPC endpoints cap `getLogs` at ~10,000-50,000 blocks. The dashboard must use the contract's deployment block as `fromBlock` (not block 0) and query in rolling batches. Add a "Load earlier transactions" button for pagination.

### 2.4 Toolchain: Arc Foundry (`arc-forge`)
* Smart contracts are built and tested using **Arc Foundry (`circlefin/arc-foundry`)** and standard EVM Foundry tools with Arc RPC configurations.

### 2.5 Scope Boundaries & Deferred Features
* **Cross-Chain / CCTP**: Explicitly deferred to V2 to highlight Arc's sub-second single-currency advantage.
* **ArcPOS Terminal (`/pos`)**: Deferred to post-hackathon roadmap.
* **Developer Playground (`/playground`)**: Replaced by interactive code snippets inside the **Documentation Hub (`/docs`)** and live interactive buttons on the **Demo Storefront**.

---

## 3. Business Model & Protocol Fee Economics (The 0.4% Model)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PAYMENT & FEE FLOW (0.4% MODEL)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Customer pays $100.00 USDC                                                │
│         │                                                                   │
│         ▼                                                                   │
│   ArcPaymentGateway.sol (Arc Mainnet / Testnet)                             │
│         │                                                                   │
│         ├── (99.6%) ──► $99.60 USDC  ──► Merchant Wallet (Instant Settlement)│
│         │                                                                   │
│         └── ( 0.4%) ──► $ 0.40 USDC  ──► ArcPay Protocol Treasury           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **0.40% Protocol Fee (40 bps)**: 7x cheaper than Stripe's 2.9% + $0.30 cut.
* **Hardcoded Safety Cap**: Max fee cap in smart contract is 1.00% (100 bps).
* **Sustainable Revenue**: At $1M monthly processing volume, the protocol generates **$4,000/month** non-custodial revenue for the ArcPay DAO/Treasury.

---

## 4. Component Technical Specifications

### A. Smart Contract Layer (`contracts/`)

#### [`ArcPaymentGateway.sol`](file:///home/abuki/Desktop/projects/self/arc/arcmicrogrant/contracts/src/ArcPaymentGateway.sol)
* **Solidity Version**: `^0.8.20`
* **Data Struct**:
  ```solidity
  struct PaymentRecord {
      bytes32 orderId;           // Unique 32-byte cryptographic identifier
      address merchant;          // Recipient merchant wallet
      address payer;             // Address of customer / wallet
      address token;             // address(0) for native USDC
      uint256 amount;            // Gross USDC amount sent (18 decimals)
      uint256 protocolFee;       // 0.4% fee amount routed to treasury
      uint256 timestamp;         // Block timestamp of settlement
      bool isSettled;            // Status flag (true = settled)
      string metadata;           // Order metadata string (JSON, SKU, customer ref)
  }
  ```
* **Functions**:
  * `payNative(bytes32 orderId, address payable merchant, string calldata metadata) payable`:
    - Validates `msg.value > 0`, `merchant != address(0)`, and `!payments[orderId].isSettled`.
    - Routes `0.4%` fee to `feeRecipient` and `99.6%` to `merchant`.
    - Emits `PaymentSettled(...)`.
  * `payNativeWithSplit(bytes32 orderId, address payable merchant, uint256 merchantAmount, address payable affiliate, uint256 affiliateAmount, string calldata metadata) payable`:
    - Handles custom splits (e.g. Creator 80%, Platform 19.6%, ArcPay Treasury 0.4%).
  * `getPayment(bytes32 orderId) view returns (PaymentRecord memory)`:
    - View function returning settlement record.
  * `setFeeConfig(uint256 _feeBps, address payable _feeRecipient) onlyOwner`:
    - Updates protocol fee (capped at 100 bps / 1.00%).

---

### B. TypeScript SDK Layer (`packages/sdk/`)

* **Package Name**: `@arcpay/sdk`
* **Build Target**: Dual ESM/CJS with full `.d.ts` declaration maps.

#### 1. React Pre-Built Component: `<ArcPayButton />`
```tsx
import { ArcPayButton } from '@arcpay/sdk/react';

<ArcPayButton
  merchant="0xMerchantAddress..."
  amount={29.00}
  item="CloudAI Pro Plan"
  metadata={{ userId: "usr_4021" }}
  onSuccess={(receipt) => console.log("Paid on Arc:", receipt.txHash)}
  onError={(err) => console.error(err)}
/>
```
* **Order ID is auto-generated by the SDK**. Developers never pass `orderId` directly — the SDK generates a unique `bytes32` hash per checkout attempt to prevent replay reverts on retries or renewals. Stable user identifiers (e.g. `userId`) go in `metadata`.
* Automatically handles:
  - Button styling (customizable themes: emerald, dark, minimal).
  - Opening the built-in checkout modal.
  - Injected wallet connection and automatic network switching to Arc.
  - Mobile browser detection: displays QR code and "Open in MetaMask" deep link if no injected provider is found.
  - Submitting transaction and triggering success callbacks.

#### 2. Universal Web Component: `<arc-pay-button>`
* Custom element for non-React websites (Webflow, Shopify, WordPress, Vanilla HTML):
```html
<script src="https://cdn.arcpay.network/v1/arcpay.js"></script>
<arc-pay-button
  merchant="0xMerchantAddress..."
  amount="29.00"
  item="Digital Design Pack">
</arc-pay-button>
```

#### 3. Headless React Hook: `useCheckout()`
* For developers building bespoke UI workflows:
```tsx
const { checkout, isPaying, isSuccess, error } = useCheckout();
await checkout({ merchant, amount: 29.00, orderId });
```

#### 4. Server-Side Verification: `verifyArcPayment()`
* 4-step cryptographic verification engine querying Arc RPC in `<50ms`.

---

### C. Web Application & UI Architecture (`apps/web/`)

* **Framework**: Next.js 15 App Router, React 19, Tailwind CSS, shadcn/ui components.
* **Routes**:
  1. **`/` (Overview & Demo Storefront)**:
     - Hero overview with 0.4% fee comparisons vs Stripe.
     - **Live Demo Storefront**: Interactive SaaS pricing card ("CloudAI Pro - $29 USDC") using `<ArcPayButton />` with live code preview tabs.
  2. **`/dashboard` (Merchant Dashboard)**:
     - Connect wallet to view real-time sales feed and total volume.
     - Client-side Wagmi `useWatchContractEvent` and `getLogs` queries.
  3. **`/create` (PayLink Studio)**:
     - No-code link generator for creators, invoices, and digital goods.
     - Real-time customer checkout preview.
  4. **`/pay` (Hosted 1-Click Checkout)**:
     - Standalone checkout page for shareable PayLinks.
  5. **`/docs` (Documentation Hub)**:
      - Step-by-step Quickstart guide, `<ArcPayButton />` props table, `useCheckout()` reference, and server verification tutorials.
      - **Payment Recovery**: Document that SaaS backends should call `verifyArcPayment()` independently to recover payments where the customer closed the tab before the frontend confirmed.

---

## 5. Network Specifications & Environments

| Parameter | Arc Testnet (Phase 1) | Arc Mainnet (Phase 2) |
| :--- | :--- | :--- |
| **Network Name** | Arc Testnet | Arc |
| **Chain ID** | `5042002` | `5042` |
| **RPC Endpoint** | `https://rpc.testnet.arc.io` | `https://rpc.mainnet.arc.io` |
| **Native Gas Currency** | `USDC` (18 Decimals) | `USDC` (18 Decimals) |
| **Block Explorer** | `https://explorer.testnet.arc.io` | `https://explorer.arc.io` |
| **Faucet** | `https://faucet.circle.com` (Arc Testnet) | N/A |

---

## 6. Implementation Checklist & Progress

* [ ] **Phase 1: Smart Contract Layer (Foundry / arc-forge)**
  - [ ] Write `ArcPaymentGateway.sol` (0.4% fee, split routing, replay protection).
  - [ ] Write `ArcPaymentGateway.t.sol` unit tests (100% test coverage).
  - [ ] Configure `Deploy.s.sol` and `foundry.toml` for Arc networks.

* [ ] **Phase 2: TypeScript SDK Layer (`@arcpay/sdk`)**
  - [ ] Implement core utilities, ABI, and Viem chain configurations.
  - [ ] Implement `<ArcPayButton />` React Component and Checkout Modal.
  - [ ] Implement `<arc-pay-button>` Custom Element Web Component.
  - [ ] Implement `useCheckout()` headless React hook.
  - [ ] Implement server-side `verifyArcPayment()` RPC engine.

* [ ] **Phase 3: Web Application with shadcn/ui (`apps/web`)**
  - [ ] Set up shadcn/ui design system.
  - [ ] Build Demo Storefront on `/` (SaaS pricing card with live button).
  - [ ] Build Merchant Dashboard on `/dashboard` (Wagmi event stream).
  - [ ] Build PayLink Studio on `/create` and Hosted Checkout on `/pay`.
  - [ ] Build Documentation Hub on `/docs`.

* [ ] **Phase 4: Arc Testnet Deployment & Verification**
  - [ ] Deploy contract to Arc Testnet (`Chain ID: 5042002`).
  - [ ] Test end-to-end payment flows with Circle Faucet USDC.

* [ ] **Phase 5: Mainnet Staging & DoraHacks Submission Pack**
  - [ ] Prepare Arc Mainnet deployment configuration (`Chain ID: 5042`).
  - [ ] Generate README.md, architecture diagrams, and 60-second video demo walkthrough.
