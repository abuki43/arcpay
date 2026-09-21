# ArcPay — Comprehensive Master Plan & Architecture Specification

## 1. Executive Summary & Vision

**ArcPay** is a decentralized, developer-first payment protocol, TypeScript SDK, and Point-of-Sale ecosystem built natively for the **Arc Network** (Circle's Layer-1 blockchain).

ArcPay bridges web2 commerce and web3 stablecoins by exploiting Arc's native superpower: **USDC is the native gas asset** and settlement has **sub-second deterministic finality (~600ms)**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARCPAY PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRIMARY PROTOCOL:  ArcPaymentGateway.sol (Arc Testnet -> Arc Mainnet)     │
│                      "Instant USDC routing, 0.4% fee model, split routing"  │
│                                                                             │
│   DEVELOPER SDK:     @arcpay/sdk (Client & Server)                          │
│                      "Drop-in <ArcPayButton /> & verifyArcPayment() engine" │
│                                                                             │
│   NO-CODE MERCHANTS: Arc PayLinks (/create & /pay)                          │
│                      "1-click shareable checkout URLs for SaaS & creators"  │
│                                                                             │
│   FLAGSHIP SHOWCASE: ArcPOS Terminal (/pos)                                 │
│                      "In-person cashier terminal with dynamic QR & audio"   │
│                                                                             │
│   DOCUMENTATION HUB: Full API & Developer Docs (/docs & /playground)        │
│                      "Interactive snippets for React, Node, HTML, cURL"     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Business Model & Protocol Fee Economics (The 0.4% Model)

### How ArcPay Generates Revenue:
* **0.4% Protocol Fee (40 bps)**: On every settled transaction, 99.6% goes directly to the merchant wallet, and 0.4% goes to the ArcPay Protocol Treasury.
* **7x Cheaper than Stripe**: Traditional rails charge **2.9% + $0.30**. On a $100 sale, Stripe takes **$3.20**, while ArcPay takes only **$0.40**.
* **Sustainable Treasury Growth**: At $1M monthly processing volume, the protocol generates **$4,000/month** in non-custodial USDC revenue deposited automatically on-chain.
* **Configurable & Transparent**: The fee is hardcoded in the smart contract with a maximum safety cap of 1.0% (100 bps) and initialized at **0.4% (40 bps)**.

---

## 3. Why Arc-Native? (The Core Differentiator)

| Feature | Legacy Rails (Stripe / Square) | Traditional Crypto (Ethereum/Base) | ArcPay on Arc L1 |
| :--- | :--- | :--- | :--- |
| **Merchant Processing Cut** | 2.9% + $0.30 per sale | 1.0% + Token Gas Swaps | **0.4% Protocol Fee (7x Cheaper)** |
| **Settlement Time** | 3 to 7 business days | 5 to 15 minutes | **~600 Milliseconds (Instant)** |
| **Gas Asset** | N/A | Must hold volatile ETH/SOL | **USDC only (Zero Friction)** |
| **Chargeback Fraud** | High risk for SaaS | Irreversible | **Zero Chargeback Risk** |
| **Accounting** | Complex currency conversion | Multi-currency volatility | **1-to-1 Pure Dollar Ledger** |

---

## 4. Detailed User & Merchant Flows

### Flow A: The SaaS Creator Flow (Automated Integration)
1. **Integration**: Developer installs `@arcpay/sdk` and drops the `<ArcPayButton />` into their pricing page.
2. **Order Tagging**: The SaaS generates a unique `orderId` (e.g. `sub_usr4021_172600000`) linked to the customer's account in their database.
3. **Payment Execution**: Customer approves and pays on Arc. Gas is paid directly in cents of USDC.
4. **Server Verification**: The SaaS backend receives the transaction hash and calls `verifyArcPayment()`.
5. **Cryptographic RPC Check**: The backend verifies directly against the Arc RPC:
   - Transaction status is `success`.
   - `merchant` matches the creator's real wallet address.
   - `amount` matches the required price in USDC.
   - `orderId` matches the pending subscription.
6. **Instant Account Unlock**: The database marks the user as Pro in **<50ms** after on-chain confirmation.

### Flow B: The No-Code Creator Flow (PayLinks)
1. Creator visits **ArcPay PayLink Studio** (`/create`).
2. Fills in: Title ("1-Hour AI Consultation"), Price ("50.00 USDC"), and their Arc Wallet address.
3. Clicks **"Generate PayLink"** -> Gets a shareable URL (`https://arcpay.network/pay?merchant=0x...&amount=50&item=Consultation`) and QR code.
4. Creator shares the link via email, Twitter, Discord, or blog.
5. Customer clicks link, connects wallet, and pays with 1 click.

### Flow C: The In-Person Retail Flow (ArcPOS Cashier Terminal)
1. Merchant opens **ArcPOS Terminal** (`/pos`) on a tablet, phone, or laptop.
2. Enters `$4.50` on the cashier keypad or selects a quick preset (e.g. "🍵 Matcha Latte").
3. Terminal displays a dynamic QR code formatted with the payment intent on Arc.
4. Customer scans and signs with their mobile wallet.
5. In **~600ms**, the terminal receives the on-chain confirmation, plays a crisp audio chime, shoots confetti, and displays/prints a digital receipt with the Arc Explorer verification link.

---

## 5. Anti-Forgery & Security Architecture

To prevent malicious users from modifying client-side amounts or spoofing payment confirmations:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   THE 4-STEP BACKEND VERIFICATION ENGINE                    │
└─────────────────────────────────────────────────────────────────────────────┘

  Client sends: POST /api/verify-payment { txHash: "0xabc...", orderId: "ord_1" }
                                │
                                ▼
  Server queries Arc RPC (https://rpc.testnet.arc.io or https://rpc.mainnet.arc.io):
  
  [Check 1] Did tx 0xabc... successfully execute on Arc in a valid block?
            └── If NO / Pending ──► ❌ REJECT (Fake Hash)
            
  [Check 2] Did it call the official ArcPaymentGateway contract?
            └── If NO ────────────► ❌ REJECT (Fake Contract)
            
  [Check 3] Is the 'merchant' in the event YOUR real wallet address?
            └── If NO ────────────► ❌ REJECT (Paid to wrong recipient/themselves)
            
  [Check 4] Is 'amount' >= expected amount and 'orderId' == "ord_1"?
            └── If NO ────────────► ❌ REJECT (Underpaid / Tampered Amount)
            
  [All Passed] ───────────────────► ✅ SAFE TO UNLOCK SERVICE IN DATABASE
```

---

## 6. Network Parameters & Staged Rollout

### Phase 1: Arc Testnet (Development & Verification)
* **Network Name**: Arc Testnet
* **Chain ID**: `5042002`
* **RPC URL**: `https://rpc.testnet.arc.io`
* **Currency Symbol**: `USDC` (18 Decimals)
* **Block Explorer**: `https://explorer.testnet.arc.io`
* **Faucet**: `https://faucet.circle.com` (Select "Arc Testnet")

### Phase 2: Arc Mainnet (Final Deployment & Submission)
* **Network Name**: Arc
* **Chain ID**: `5042`
* **RPC URL**: `https://rpc.mainnet.arc.io`
* **Currency Symbol**: `USDC` (18 Decimals)
* **Block Explorer**: `https://explorer.arc.io`
* **USDC ERC-20 Precompile**: `0x3600000000000000000000000000000000000000`

---

## 7. Project Monorepo Structure & UI Stack

```
arcmicrogrant/
├── plan.md                          # Master specification document
├── pnpm-workspace.yaml              # Monorepo workspace configuration
│
├── contracts/                       # Foundry smart contracts
│   ├── foundry.toml                 # Configured for Arc Testnet & Mainnet
│   ├── src/
│   │   └── ArcPaymentGateway.sol    # Core payment routing, 0.4% fee & split contract
│   ├── test/
│   │   └── ArcPaymentGateway.t.sol  # 100% test coverage suite
│   └── script/
│       └── Deploy.s.sol             # Deployment script for Testnet & Mainnet
│
├── packages/
│   └── sdk/                         # @arcpay/sdk (TypeScript / Viem client & server)
│       ├── src/
│       │   ├── index.ts             # Main exports
│       │   ├── abi.ts               # Gateway contract ABI
│       │   ├── chains.ts            # arcTestnet & arcMainnet Viem definitions
│       │   ├── server.ts            # verifyArcPayment() RPC engine
│       │   ├── types.ts             # TypeScript interfaces
│       │   └── utils.ts             # parseUsdc, formatUsdc, generateOrderId
│       ├── package.json             # ESM/CJS exports
│       └── tsconfig.json
│
└── apps/
    └── web/                         # Next.js 15 + Tailwind + shadcn/ui
        ├── components/ui/           # shadcn/ui components (Button, Card, Dialog, Tabs, Toast, etc.)
        ├── app/
        │   ├── page.tsx             # Landing page & feature comparisons
        │   ├── pos/page.tsx         # ArcPOS Cashier Terminal (Dynamic QR + Audio)
        │   ├── create/page.tsx      # PayLink Studio & Link Generator
        │   ├── pay/page.tsx         # Hosted 1-Click Checkout modal
        │   ├── docs/page.tsx        # Comprehensive Documentation Hub
        │   └── playground/page.tsx  # Developer Playground & RPC Verifier
        ├── components/
        │   ├── Navbar.tsx           # Navigation, Faucet link & Docs
        │   └── WalletButton.tsx     # Arc Network switcher & wallet connect
        └── lib/
            ├── constants.ts         # Chain IDs, RPCs, Explorers, Addresses
            ├── wagmi.ts             # Wagmi provider setup
            └── audio.ts             # Web Audio API POS chime synthesizer
```

---

## 8. Implementation Status & Progress Checklist

* [ ] **Phase 1: Smart Contract Layer**
  - [ ] Implement `ArcPaymentGateway.sol` with 0.4% fee deduction, split payments, and order tracking.
  - [ ] Implement comprehensive Foundry unit tests (`ArcPaymentGateway.t.sol`).
  - [ ] Write deployment scripts for Arc Testnet & Mainnet (`Deploy.s.sol`).

* [ ] **Phase 2: TypeScript SDK Layer (`@arcpay/sdk`)**
  - [ ] Implement Client payment helpers, Viem chain configs, and order ID generators.
  - [ ] Implement Server-side `verifyArcPayment()` RPC verification engine.
  - [ ] Configure dual ESM/CJS build and TypeScript type exports.

* [ ] **Phase 3: Web Application & shadcn/ui Layer (`apps/web`)**
  - [ ] Set up shadcn/ui design system and components.
  - [ ] Implement ArcPOS Terminal (`/pos`) with dynamic QR and Web Audio chime.
  - [ ] Implement PayLink Studio (`/create`) and Hosted Checkout (`/pay`).
  - [ ] Implement Documentation Hub (`/docs`) and Developer Playground (`/playground`).

* [ ] **Phase 4: Arc Testnet Deployment & Verification**
  - [ ] Deploy contract to Arc Testnet (`Chain ID: 5042002`).
  - [ ] Test end-to-end payment flows with Circle Faucet USDC.

* [ ] **Phase 5: Arc Mainnet Staging & DoraHacks Submission Pack**
  - [ ] Prepare Arc Mainnet deployment configuration (`Chain ID: 5042`).
  - [ ] Generate README.md, video walkthrough script, and DoraHacks grant application copy.
