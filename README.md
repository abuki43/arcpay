# ArcPay

**1-Click USDC Checkout Protocol for Arc.**

ArcPay lets any website, app, or creator accept native USDC payments on the Arc L1 blockchain in a single click. No redirects, no forms, no custody. Settlements are sub-second, non-custodial, and cost a flat 0.40% protocol fee.

Built for the [Arc Microgrants](https://dorahacks.io/hackathon/arc-microgrants) hackathon.

---

## What ArcPay Does

- **Checkout SDK** — drop-in React component, universal web component, or headless hook that opens a payment modal and settles USDC on Arc in ~600ms
- **PayLinks** — shareable payment links with multi-plan pricing, email/handle collection, and redirect URLs
- **Merchant Dashboard** — real-time settlement feed, PayLink management, per-link analytics, and HMAC-signed webhooks
- **Network Analytics** — protocol-wide volume, fees, and settlement activity indexed from Arc L1
- **Settlement Indexer** — background worker that listens to `PaymentSettled` and `PaymentSplitSettled` events and writes them to PostgreSQL

## How It Uses Arc

ArcPay is built natively on Arc (chain ID 5042 mainnet / 5042002 testnet):

- **Native USDC as gas** — Arc uses USDC as its native gas token, so payments settle in the same asset that pays for transaction fees. No ETH bridging needed.
- **Sub-second finality** — Arc's ~600ms block time means payments confirm before the modal closes.
- **EVM-compatible** — the smart contract is standard Solidity 0.8.20, and the SDK uses viem for all chain interactions.
- **Pure-push settlement** — the `ArcPaymentGateway` contract routes funds directly from payer to merchant + fee recipient in a single atomic transaction. No escrow, no custody.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Arc L1 Blockchain          │
                    │  ┌───────────────────────────────┐  │
                    │  │   ArcPaymentGateway.sol       │  │
                    │  │   payNative()                 │  │
                    │  │   payNativeWithSplit()        │  │
                    │  │   PaymentSettled event        │  │
                    │  │   PaymentSplitSettled event   │  │
                    │  └───────────┬───────────────────┘  │
                    └──────────────┼──────────────────────┘
                                   │
                    ┌──────────────┼──────────────────────┐
                    │              │                      │
          ┌─────────▼──────┐  ┌───▼──────────┐  ┌───────▼────────┐
          │  Web App       │  │  SDK         │  │  Indexer       │
          │  (Next.js)     │  │  (React +    │  │  (viem +       │
          │                │  │   Web Comp)  │  │   Prisma)      │
          │  /             │  │              │  │                │
          │  /dashboard    │  │  useCheckout│  │  polls getLogs │
          │  /create       │  │  ArcPayButton│  │  upserts       │
          │  /network      │  │  <arc-pay>   │  │  PostgreSQL    │
          │  /pay/[slug]   │  │              │  │  webhooks      │
          │  /demo         │  │              │  │                │
          └───────┬────────┘  └──────┬───────┘  └───────┬────────┘
                  │                  │                   │
                  └──────────────────┼───────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   PostgreSQL        │
                          │   (Prisma)          │
                          │                     │
                          │   Merchant          │
                          │   PayLink           │
                          │   Settlement        │
                          │   WebhookDelivery   │
                          │   IndexerCursor     │
                          └─────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+
- A wallet with USDC on Arc (testnet or mainnet)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/arcpay"

NEXT_PUBLIC_ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.io"
NEXT_PUBLIC_ARC_MAINNET_RPC_URL="https://rpc.mainnet.arc.io"
```

### 3. Run database migrations

```bash
pnpm prisma migrate dev --schema=apps/web/prisma/schema.prisma
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run the indexer (in a separate terminal)

```bash
cd apps/web && pnpm indexer
```

The indexer polls the ArcPaymentGateway contract for settlement events and writes them to PostgreSQL. Without it, the `/network` page and landing page live ledger will not populate.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm test:contracts` | Run Foundry tests |
| `cd apps/web && pnpm indexer` | Run the settlement indexer |

## Smart Contract

**ArcPaymentGateway** — Solidity 0.8.20

```solidity
function payNative(
    bytes32 orderId,
    address payable merchant,
    string calldata metadata
) external payable nonReentrant;

function payNativeWithSplit(
    bytes32 orderId,
    address payable merchant,
    uint256 merchantAmount,
    address payable affiliate,
    uint256 affiliateAmount,
    string calldata metadata
) external payable nonReentrant;
```

- **Protocol fee**: 0.40% (40 bps), routed to a configurable treasury
- **Reentrancy guard**: `nonReentrant` modifier on all payable functions
- **Settlement record**: written on-chain, queryable via `getPayment(orderId)`
- **Events**: `PaymentSettled`, `PaymentSplitSettled` — consumed by the indexer

Tests: `cd contracts && forge test -vvv`

## SDK Usage

### React

```tsx
import { ArcPayButton } from '@arcpay/sdk';

<ArcPayButton
  merchant="0xYourWalletAddress"
  amount="29.00"
  item="Pro Plan"
  theme="instrument"
  onSuccess={(receipt) => console.log(receipt.txHash)}
/>
```

### Universal Web Component

```html
<arc-pay-button
  merchant="0xYourWalletAddress"
  amount="29.00"
  item="Pro Plan"
  theme="instrument">
</arc-pay-button>
```

### Headless Hook

```tsx
import { useCheckout } from '@arcpay/sdk';

const { checkout, isPaying, receipt, error } = useCheckout();

await checkout({
  merchant: '0xYourWalletAddress',
  amount: '29.00',
  item: 'Pro Plan',
  chainId: 5042,
});
```

### Server Verification

```ts
import { verifyArcPayment } from '@arcpay/sdk';

const result = await verifyArcPayment({
  orderId: '0x...',
  merchant: '0xYourWalletAddress',
  expectedAmount: '29.00',
  maxAgeSeconds: 300,
  chainId: 5042,
});

if (result.isValid) {
  // grant access, ship product, etc.
}
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/settlements` | GET | List settlements (paginated, filterable by merchant/slug/search) |
| `/api/settlements` | POST | Record a settlement after checkout |
| `/api/paylinks` | GET/POST | List or create PayLinks |
| `/api/paylinks/[slug]` | GET/UPDATE | Fetch or update a PayLink |
| `/api/paylinks/[slug]/analytics` | GET | Per-link analytics |
| `/api/webhooks` | GET/POST | List or configure webhooks |

## Project Structure

```
arcmicrogrant/
├── apps/
│   └── web/                    # Next.js app
│       ├── app/                # Routes (/, /dashboard, /create, /network, /pay, /docs, /demo)
│       ├── components/         # UI components
│       │   ├── dashboard/      # Merchant dashboard tabs
│       │   ├── studio/         # PayLink creation studio
│       │   └── ui/             # Design system primitives
│       ├── lib/                # Hooks, utils, API helpers
│       ├── scripts/            # Indexer
│       ├── prisma/             # Database schema
│       └── public/             # Static assets
├── packages/
│   └── sdk/                    # @arcpay/sdk (React + Web Component + Server verify)
└── contracts/                  # Solidity contracts + Foundry tests
```

## Themes

The SDK supports two modern themes and four legacy themes:

| Theme | Description |
|---|---|
| `instrument` | Dark-on-light, hairline borders, amber accent (default) |
| `instrument-light` | Light-on-dark, hairline borders, amber accent |
| `emerald` | Legacy green (deprecated) |
| `dark` | Legacy dark (deprecated) |
| `light` | Legacy light (deprecated) |
| `minimal` | Legacy minimal (deprecated) |

## Deployed Contracts

| Network | Chain ID | Gateway Address |
|---|---|---|
| Arc Testnet | 5042002 | `0xd35be28A0b54Dd4559494b2328E1Cb7C3f0318B7` |
| Arc Mainnet | 5042 | *Pending deployment* |

## License

MIT
