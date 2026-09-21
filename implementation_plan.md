# Technical Implementation Plan: ArcPay

This document is the exhaustive technical blueprint for **ArcPay** — an open-source, developer-first payment protocol, TypeScript SDK, and Point-of-Sale ecosystem purpose-built for the **Arc Network** (Circle's Layer-1 blockchain with native USDC gas).

---

## 1. Executive Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ARCPAY SYSTEM TOPOLOGY                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ CLIENT APPS / USERS ]           [ CREATORS / SAAS FOUNDERS ]       [ PHYSICAL RETAILERS ]
   • PayLink Checkout (/pay)         • Next.js / Node.js Backends       • ArcPOS Terminal (/pos)
   • 1-Click Wallet Signature        • No-Code Link Studio (/create)    • Dynamic EIP-681 QR
             │                                    │                               │
             └────────────────────────────────────┼───────────────────────────────┘
                                                  ▼
                         ┌─────────────────────────────────────────────────┐
                         │       ARCPAY TYPESCRIPT SDK (@arcpay/sdk)       │
                         │  • Client Transaction Helpers (Viem / Wagmi)    │
                         │  • Server verifyArcPayment() RPC Engine         │
                         │  • Chain Configs (Arc Testnet 5042002 & 5042)   │
                         └─────────────────────────────────────────────────┘
                                                  │
                                                  ▼ JSON-RPC / WebSocket
                         ┌─────────────────────────────────────────────────┐
                         │       ARC NETWORK LAYER-1 (Circle Blockchain)   │
                         │  • Native Gas Token: USDC (18 Decimals)         │
                         │  • Malachite Consensus: ~600ms Finality         │
                         │  • USDC Precompile: 0x3600...0000               │
                         └─────────────────────────────────────────────────┘
                                                  │
                                                  ▼
                         ┌─────────────────────────────────────────────────┐
                         │       ArcPaymentGateway.sol (Smart Contract)    │
                         │  • 0.40% Protocol Fee Routing to Treasury       │
                         │  • 99.60% Instant Merchant Payout               │
                         │  • Split Payment Routing (Affiliate / Platform) │
                         │  • Cryptographic Order ID & Replay Protection   │
                         │  • PaymentSettled & PaymentSplitSettled Events  │
                         └─────────────────────────────────────────────────┘
```

---

## 2. Business Model & Protocol Fee Economics (The 0.4% Model)

### 2.1 Fee Math & Settlement Mechanics
* **Protocol Fee Rate**: `40 basis points` = **`0.40%`** (`1 bp = 0.01%`).
* **Maximum Fee Safety Cap**: Hardcoded in smart contract at `100 basis points` = **`1.00%`**.
* **Formula**:
  $$\text{Protocol Fee} = \frac{\text{Payment Amount} \times 40}{10000}$$
  $$\text{Merchant Net Payout} = \text{Payment Amount} - \text{Protocol Fee}$$

### 2.2 Comparison vs Traditional & Crypto Rails

| Dimension | Legacy Rails (Stripe / Square) | Traditional Crypto (Ethereum/Base) | **ArcPay on Arc L1** |
| :--- | :--- | :--- | :--- |
| **Merchant Cut** | **2.9% + $0.30 per transaction** | 1.0% + Gas conversion losses | **0.40% Flat Protocol Fee** |
| **$50 Sale Fee** | **$1.75** (3.5% effective) | $0.50 + ETH Gas | **$0.20** (88% savings) |
| **$100 Sale Fee** | **$3.20** (3.2% effective) | $1.00 + ETH Gas | **$0.40** (87% savings) |
| **Payout Delay** | **3 to 7 business days** | 5 to 15 minutes | **~600 Milliseconds (Instant)** |
| **Gas Dependency** | None (Fiat) | Must buy & manage ETH/SOL | **Pure USDC (Zero gas friction)** |
| **Chargeback Risk** | High (Fraudulent disputes hurt SaaS)| None | **Zero (Mathematical finality)** |

---

## 3. Component Deep Dive & Specifications

### 3.1 Smart Contract Layer (`contracts/`)

#### Contract: `ArcPaymentGateway.sol`
* **Solidity Version**: `^0.8.20`
* **EVM Target**: Paris / Shanghai compatible (Standard EVM for Arc)
* **Data Structures**:
  ```solidity
  struct PaymentRecord {
      bytes32 orderId;           // Unique 32-byte cryptographic identifier
      address merchant;          // Recipient merchant wallet
      address payer;             // Address of customer / wallet
      address token;             // address(0) for native USDC
      uint256 amount;            // Total gross USDC amount sent (18 decimals)
      uint256 protocolFee;       // 0.4% fee amount deducted to treasury
      uint256 timestamp;         // Block timestamp of settlement
      bool isSettled;            // Status flag (true = settled)
      string metadata;           // Arbitrary metadata (JSON, SKU, order notes)
  }
  ```

* **Core Functions**:
  1. `payNative(bytes32 orderId, address payable merchant, string calldata metadata) external payable`:
     - Checks: `msg.value > 0`, `merchant != address(0)`, and `!payments[orderId].isSettled`.
     - Calculates: `fee = (msg.value * feeBps) / 10000` (0.4%).
     - Transfers `fee` to `feeRecipient` (protocol treasury).
     - Transfers `msg.value - fee` (99.6%) to `merchant`.
     - Stores `payments[orderId]` record.
     - Emits `PaymentSettled(orderId, merchant, msg.sender, address(0), msg.value, fee, block.timestamp, metadata)`.

  2. `payNativeWithSplit(bytes32 orderId, address payable merchant, uint256 merchantAmount, address payable affiliate, uint256 affiliateAmount, string calldata metadata) external payable`:
     - Allows dynamic revenue sharing (e.g. 80% Creator, 19.6% Platform, 0.4% ArcPay Treasury).
     - Verifies: `merchantAmount + affiliateAmount + fee == msg.value`.
     - Transfers each allocation in a single atomic transaction.
     - Emits `PaymentSplitSettled(...)`.

  3. `getPayment(bytes32 orderId) external view returns (PaymentRecord memory)`:
     - Returns on-chain settlement details for external verification.

  4. `setFeeConfig(uint256 _feeBps, address payable _feeRecipient) external onlyOwner`:
     - Enforces `require(_feeBps <= 100, "ArcPay: fee cannot exceed 1.00%")`.

#### Testing Suite: `contracts/test/ArcPaymentGateway.t.sol`
* **Coverage Requirements**: 100% test coverage using Foundry.
* **Test Cases**:
  - `testPayNativeWith04PercentFee()`: Validates exact math on 100 USDC payment ($99.60 to merchant, $0.40 to treasury).
  - `testRevertZeroPayment()`: Reverts when `msg.value == 0`.
  - `testRevertInvalidMerchant()`: Reverts when `merchant == address(0)`.
  - `testRevertDuplicateOrderSettlement()`: Reverts replay attacks on the same `orderId`.
  - `testPayNativeWithSplitAndFee()`: Validates multi-recipient atomic split routing.
  - `testFeeConfigCapAt1Percent()`: Enforces protocol fee cap.
  - `testTransferOwnership()`: Validates owner access control.

---

### 3.2 TypeScript SDK Layer (`packages/sdk/`)

* **Package Name**: `@arcpay/sdk`
* **Module Formats**: Dual ESM (`dist/index.mjs`) and CommonJS (`dist/index.js`) with TypeScript declarations (`dist/index.d.ts`).
* **Dependencies**: `viem` (v2.x).

#### Client API (`@arcpay/sdk`)
1. `createPayLinkUrl(params)`:
   - Takes `{ baseUrl, merchant, amount, item, orderId, redirectUrl, metadata }`.
   - Serializes query parameters into a clean URL (`https://arcpay.network/pay?merchant=0x...&amount=29.00&item=Pro+Plan`).
2. `generateOrderId(prefix?: string)`:
   - Generates a collision-resistant `bytes32` order hash: `keccak256(toUtf8Bytes("${prefix}_${Date.now()}_${random}"))`.
3. `parseUsdc(amount: number | string): bigint`:
   - Converts standard dollar amount (`29.50`) to 18-decimal wei (`29500000000000000000n`).
4. `formatUsdc(amountWei: bigint, decimals?: number): string`:
   - Formats 18-decimal wei into formatted USD string (`"$29.50"`).
5. `arcTestnet` & `arcMainnet`:
   - Pre-configured Viem chain definitions with official RPCs and block explorers.

#### Server / Webhook API (`@arcpay/sdk/server`)
* **`verifyArcPayment(params: VerifyPaymentParams): Promise<VerificationResult>`**:
  - The core anti-forgery engine. Executes a 4-step cryptographic check against Arc RPC:
    ```
    Step 1: Fetch transaction receipt via eth_getTransactionReceipt(txHash).
            Assert receipt.status === 'success'.
    Step 2: Parse logs using ArcPaymentGatewayABI.
            Locate PaymentSettled or PaymentSplitSettled event.
    Step 3: Assert event.merchant.toLowerCase() === expectedMerchant.toLowerCase().
    Step 4: Assert event.amount >= parseUsdc(expectedAmount) AND event.orderId === expectedOrderId.
    ```
  - Returns `{ success: true, record: PaymentSettledRecord }` or `{ success: false, error: string }`.

---

### 3.3 Web Application & UI Architecture (`apps/web/`)

* **Framework**: Next.js 15 (App Router), React 19, TypeScript.
* **Styling**: Tailwind CSS with dark-mode fintech aesthetic.
* **Component Library**: **shadcn/ui** (Button, Card, Badge, Input, Tabs, Dialog, Toast).
* **Web3 Integration**: Wagmi v2 + Viem + Injected connector.

#### Route Map & Features:

```
apps/web/app/
├── layout.tsx             # Root layout with global Providers and Navbar
├── page.tsx               # Landing Page (Overview, 0.4% vs Stripe comparisons)
├── pos/
│   └── page.tsx           # ArcPOS Cashier Terminal (Dynamic QR, Web Audio chime, Receipt)
├── create/
│   └── page.tsx           # PayLink Studio (No-code generator, live preview, local history)
├── pay/
│   └── page.tsx           # Hosted 1-Click Checkout modal with Arc network auto-switch
├── docs/
│   └── page.tsx           # Comprehensive Documentation Hub (Quickstart, Fee model, SDK reference)
└── playground/
    └── page.tsx           # Interactive Code Generator & Live Arc RPC Diagnostic Tool
```

#### Detailed Page Specifications:

1. **`apps/web/app/pos/page.tsx` (ArcPOS Cashier Terminal)**:
   - **Keypad State Machine**:
     - `amountStr`: Tracks cashier input (e.g. `"4.50"`).
     - Preset buttons: Espresso ($3.50), Latte ($4.75), Bakery ($3.25), Consult ($50.00).
     - Numeric grid (1-9, ., 0, Clear, Backspace).
   - **Dynamic QR Code**:
     - Generates EIP-681 payload formatted as `ethereum:<gateway>@<chainId>/payNative?orderId=<id>&merchant=<addr>&value=<amt>`.
   - **Sound & Haptic Feedback**:
     - Built-in Web Audio API synthesizer (`playSuccessChime()`) playing high-frequency dual sine wave (E5 -> B5).
     - Confetti canvas explosion (`canvas-confetti`).
   - **Receipt Modal**:
     - Displays Order ID, Merchant, Amount, 0.4% Fee, Timestamp, and live Arc Explorer link.
   - **Instant Sandbox Mode**:
     - 1-click simulation allowing judges/reviewers to experience the full checkout flow without live wallet funds.

2. **`apps/web/app/create/page.tsx` (PayLink Studio)**:
   - Form inputs: Item Title, Amount in USDC, Merchant Payout Address, Product Description, Success Redirect URL.
   - Real-time live preview card simulating customer checkout screen.
   - Generates instant copyable URL and QR code.
   - Saves created links to `localStorage` for merchant dashboard history.

3. **`apps/web/app/pay/page.tsx` (Hosted 1-Click Checkout)**:
   - Reads URL search params (`merchant`, `amount`, `item`, `redirectUrl`, `orderId`).
   - Wallet connection check & balance display.
   - Automatic Arc network detection (prompts to switch to Arc Testnet / Mainnet).
   - Single-click payment execution (`payNative`).
   - Success state with explorer transaction link and automatic redirect.

4. **`apps/web/app/docs/page.tsx` (Documentation Hub)**:
   - Interactive table of contents.
   - Section 1: Quickstart guide (installing `@arcpay/sdk` and embedding `<ArcPayButton />`).
   - Section 2: The 0.4% fee model and fee economics breakdown.
   - Section 3: Server-side `verifyArcPayment()` implementation in Next.js API routes.
   - Section 4: Smart contract method signatures and event schemas.
   - Section 5: Network constants (Chain IDs, RPCs, Explorers, Circle Faucet link).

5. **`apps/web/app/playground/page.tsx` (Developer Studio & Diagnostics)**:
   - Interactive prop configuration (adjust amount, order ID, merchant address).
   - Code viewer tabs: React Component, Node.js Webhook, cURL / RPC, Vanilla HTML.
   - Live RPC Diagnostic Tool: Input any Arc transaction hash and test the verification engine with latency measurement.

---

## 4. Network Specifications & Environment Staging

| Parameter | Arc Testnet (Phase 1) | Arc Mainnet (Phase 2) |
| :--- | :--- | :--- |
| **Network Name** | Arc Testnet | Arc |
| **Chain ID** | `5042002` | `5042` |
| **RPC URL** | `https://rpc.testnet.arc.io` | `https://rpc.mainnet.arc.io` |
| **Currency Symbol** | `USDC` | `USDC` |
| **Decimals** | 18 | 18 |
| **Block Explorer** | `https://explorer.testnet.arc.io` | `https://explorer.arc.io` |
| **USDC ERC-20 Precompile** | `0x3600000000000000000000000000000000000000` | `0x3600000000000000000000000000000000000000` |
| **Faucet** | `https://faucet.circle.com` (Select Arc Testnet) | N/A |

---

## 5. Implementation Roadmap

```
  Phase 1: Smart Contracts (Foundry)
  ├── 1.1 Write ArcPaymentGateway.sol (0.4% fee, split routing, replay protection)
  ├── 1.2 Write ArcPaymentGateway.t.sol (100% test coverage)
  ├── 1.3 Compile and verify test suite via `forge test -vvv`
  └── 1.4 Configure Deploy.s.sol and foundry.toml for Arc networks

  Phase 2: TypeScript SDK (@arcpay/sdk)
  ├── 2.1 Set up packages/sdk configuration (package.json, tsconfig.json, tsup)
  ├── 2.2 Implement client helpers (chains, utils, ABI, types)
  ├── 2.3 Implement server verifyArcPayment() RPC engine
  └── 2.4 Build and export dual ESM/CJS bundles

  Phase 3: Web Application with shadcn/ui (apps/web)
  ├── 3.1 Configure shadcn/ui components (Button, Card, Badge, Input, Tabs, Dialog)
  ├── 3.2 Configure Wagmi v2 and Viem for Arc Testnet and Mainnet
  ├── 3.3 Implement ArcPOS Terminal (/pos) with dynamic QR and Web Audio synthesizer
  ├── 3.4 Implement PayLink Studio (/create) and Hosted Checkout (/pay)
  ├── 3.5 Implement Documentation Hub (/docs) and Developer Playground (/playground)
  └── 3.6 Verify production build with `pnpm build`

  Phase 4: Testnet Deployment & Faucet Verification
  ├── 4.1 Deploy ArcPaymentGateway to Arc Testnet (Chain ID: 5042002)
  ├── 4.2 Test end-to-end payment flows with Circle Faucet USDC
  └── 4.3 Verify transaction receipts on ArcScan Testnet

  Phase 5: Mainnet Staging & DoraHacks Submission Pack
  ├── 5.1 Prepare Arc Mainnet deployment configuration (Chain ID: 5042)
  ├── 5.2 Create project README.md, architecture diagrams, and submission copy
  └── 5.3 Prepare 60-second video demo walkthrough script
```

---

## 6. Verification & Quality Assurance Strategy

1. **Foundry Unit Testing**:
   ```bash
   cd contracts && forge test -vvv
   ```
   *Validates 0.4% fee deductions, split math, zero slippage, replay rejection, and reentrancy protection.*

2. **SDK Build Verification**:
   ```bash
   pnpm --filter @arcpay/sdk build
   ```
   *Verifies zero TypeScript errors and compiles `.mjs`, `.js`, and `.d.ts` outputs.*

3. **Web Production Build**:
   ```bash
   pnpm --filter arcpay-web build
   ```
   *Validates all 6 static/dynamic routes (`/`, `/pos`, `/create`, `/pay`, `/docs`, `/playground`).*

4. **Live End-to-End Test Matrix**:
   * **POS Flow**: Input `$4.50` -> Scan QR / Click Pay -> Chime plays -> Digital receipt displays verified explorer link.
   * **PayLink Flow**: Generate `$29.00` PayLink -> Open in browser -> Pay with USDC -> Confirm order metadata.
   * **RPC Diagnostic Flow**: Submit transaction hash on `/playground` -> Confirm verified on Arc RPC in `<50ms`.
