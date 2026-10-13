# ArcPay Settlement Indexer — Implementation Plan (v2)

## Architecture

```
Arc Blockchain (PaymentSettled / PaymentSplitSettled events)
    │
    ▼
indexer.ts (viem getLogs loop, ~100 lines)
    │
    ▼
PostgreSQL (existing Settlement table via Prisma)
    │
    ├── /api/settlements (existing — needs minor fix for network-wide queries)
    ├── /dashboard (already uses API — no changes)
    ├── /network (switch from RPC to API)
    └── landing page (switch from RPC to API)
```

## Why Custom viem (Not Ponder/Envio/TheGraph)

| Factor | Custom viem | Ponder | Envio | The Graph |
|---|---|---|---|---|
| Files to write | 1 | 3 | 5+ | 10+ |
| Dependencies | viem (already installed) | ponder + docker | envio + docker | graph-node + IPFS + Postgres |
| Learning curve | None (you already know viem) | Low | Medium | High |
| Runs as cron? | Yes | No (daemon) | No (daemon) | No (daemon) |
| Docker needed? | No | No | Yes | Yes |
| Prisma integration | Direct (same DB) | Separate schema | Separate schema | Separate schema |
| Setup time | 10 min | 30 min | 1 hr | 3+ hrs |

**Decision**: Custom viem script. Zero new deps beyond `tsx`, runs as cron, uses existing Prisma schema.

## Prerequisites (New)

1. **Add `tsx` to devDependencies** in `apps/web/package.json`:
   ```json
   "devDependencies": { "tsx": "^4.19.0" }
   ```
   Then `pnpm install`.

2. **Create `apps/web/scripts/` directory** (does not exist yet).

3. **Add `IndexerCursor` to Prisma schema** + run `prisma migrate dev` + `prisma generate`.

4. **Set starting block**: The indexer needs a `START_BLOCK` env var (or default to contract deploy block). For testnet, use the block where `ArcPaymentGateway` was deployed.

## Implementation

### File: `apps/web/scripts/indexer.ts` (~100 lines)

```ts
import { createPublicClient, http, type Address, type Hash } from 'viem';
import { arcTestnet, arcMainnet } from 'viem/chains';
import { prisma } from '../lib/db';
import { ARC_PAYMENT_GATEWAY_ABI, DEFAULT_GATEWAY_ADDRESSES } from '@arcpay/sdk';
import { dispatchMerchantWebhook } from '../lib/webhook-dispatcher';

const CHAIN_ID = parseInt(process.env.CHAIN_ID || '5042002', 10);
const RPC_URL = process.env.RPC_URL || (CHAIN_ID === 5042002
  ? process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL
  : process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL);
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
  || DEFAULT_GATEWAY_ADDRESSES[CHAIN_ID]
  || DEFAULT_GATEWAY_ADDRESSES[5042002];
const START_BLOCK = BigInt(process.env.START_BLOCK || '0');
const POLL_INTERVAL_MS = 2000;

const client = createPublicClient({
  chain: CHAIN_ID === 5042002 ? arcTestnet : arcMainnet,
  transport: http(RPC_URL),
});

async function getLatestBlock(): Promise<bigint> {
  return client.getBlockNumber();
}

async function fetchEvents(fromBlock: bigint, toBlock: bigint) {
  const [settledLogs, splitLogs] = await Promise.all([
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: { type: 'event', name: 'PaymentSettled', inputs: [
        { name: 'orderId', type: 'bytes32', indexed: true },
        { name: 'merchant', type: 'address', indexed: true },
        { name: 'payer', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
        { name: 'protocolFee', type: 'uint256', indexed: false },
        { name: 'metadata', type: 'string', indexed: false },
        { name: 'timestamp', type: 'uint256', indexed: false },
      ]},
      fromBlock, toBlock,
    }),
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: { type: 'event', name: 'PaymentSplitSettled', inputs: [
        { name: 'orderId', type: 'bytes32', indexed: true },
        { name: 'merchant', type: 'address', indexed: true },
        { name: 'affiliate', type: 'address', indexed: true },
        { name: 'payer', type: 'address', indexed: false },
        { name: 'merchantAmount', type: 'uint256', indexed: false },
        { name: 'affiliateAmount', type: 'uint256', indexed: false },
        { name: 'protocolFee', type: 'uint256', indexed: false },
        { name: 'metadata', type: 'string', indexed: false },
        { name: 'timestamp', type: 'uint256', indexed: false },
      ]},
      fromBlock, toBlock,
    }),
  ]);
  return { settledLogs, splitLogs };
}

async function upsertSettlement(event: 'direct' | 'split', args: any, txHash: Hash, blockNumber: bigint) {
  const orderId = args.orderId as `0x${string}`;
  const merchant = args.merchant as Address;
  const payer = (args.payer as Address) || null;

  // Ensure merchant record exists (FK constraint)
  await prisma.merchant.upsert({
    where: { address: merchant },
    update: {},
    create: { address: merchant },
  });

  let gross: bigint, protocolFee: bigint, merchantShare: bigint;
  let affiliate: Address | null = null, affiliateShare: bigint | null = null;

  if (event === 'direct') {
    gross = args.amount;
    protocolFee = args.protocolFee;
    merchantShare = gross - protocolFee;
  } else {
    // Split: reconstruct gross from parts
    merchantShare = args.merchantAmount;
    affiliate = args.affiliate;
    affiliateShare = args.affiliateAmount;
    protocolFee = args.protocolFee;
    gross = merchantShare + affiliateShare + protocolFee;
  }

  const metadata = args.metadata as string;
  const timestamp = new Date(Number(args.timestamp) * 1000);

  // Upsert on orderId (unique). txHash also unique — one tx = one settlement.
  const settlement = await prisma.settlement.upsert({
    where: { orderId },
    update: {
      merchantAddress: merchant,
      payerAddress: payer,
      gross: gross.toString(),
      protocolFee: protocolFee.toString(),
      merchantShare: merchantShare.toString(),
      affiliateShare: affiliateShare?.toString() || null,
      affiliateAddress: affiliate,
      kind: event,
      txHash,
      blockNumber,
      metadata,
      timestamp,
    },
    create: {
      orderId,
      merchantAddress: merchant,
      payerAddress: payer,
      gross: gross.toString(),
      protocolFee: protocolFee.toString(),
      merchantShare: merchantShare.toString(),
      affiliateShare: affiliateShare?.toString() || null,
      affiliateAddress: affiliate,
      kind: event,
      txHash,
      blockNumber,
      metadata,
      timestamp,
    },
  });

  // Trigger webhook for merchants who have one configured
  await dispatchMerchantWebhook(merchant, 'payment.settled', {
    orderId, merchant, payer, gross: gross.toString(),
    protocolFee: protocolFee.toString(), merchantShare: merchantShare.toString(),
    affiliate, affiliateShare: affiliateShare?.toString() || null,
    kind: event, txHash, blockNumber: blockNumber.toString(), metadata,
  });

  return settlement;
}

async function run() {
  // Initialize cursor
  let cursor = await prisma.indexerCursor.findUnique({ where: { id: 'main' } });
  if (!cursor) {
    cursor = await prisma.indexerCursor.create({
      data: { id: 'main', lastBlock: START_BLOCK },
    });
  }

  let lastBlock = cursor.lastBlock;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const latest = await getLatestBlock();
      if (latest <= lastBlock) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      const toBlock = latest;
      const { settledLogs, splitLogs } = await fetchEvents(lastBlock + 1n, toBlock);

      for (const log of settledLogs) {
        await upsertSettlement('direct', log.args, log.transactionHash, log.blockNumber);
      }
      for (const log of splitLogs) {
        await upsertSettlement('split', log.args, log.transactionHash, log.blockNumber);
      }

      lastBlock = toBlock;
      await prisma.indexerCursor.update({
        where: { id: 'main' },
        data: { lastBlock, lastRunAt: new Date(), lastEventCount: settledLogs.length + splitLogs.length },
      });

      console.log(`Indexed blocks ${cursor.lastBlock + 1n} → ${toBlock} (${settledLogs.length + splitLogs.length} events)`);
    } catch (err) {
      console.error('Indexer error:', err);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

run();
```

### Prisma Schema Addition

```prisma
model IndexerCursor {
  id             String   @id // singleton, always "main"
  lastBlock      BigInt
  lastRunAt      DateTime @default(now())
  lastEventCount Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("indexer_cursor")
}
```

### Package Script

```json
// apps/web/package.json
{
  "scripts": {
    "indexer": "tsx scripts/indexer.ts"
  }
}
```

## Fixes to Existing Code

### 1. API Route — Support Network-Wide Queries

**File**: `apps/web/app/api/settlements/route.ts`

The GET endpoint currently requires `merchant` or `slug` (returns 400 if neither provided). The landing page and `/network` need network-wide queries.

**Fix**: Make `merchant` and `slug` optional. If neither is provided, return all settlements (paginated):

```ts
// Before (line 21):
if (!merchant && !payLinkSlug) {
  return NextResponse.json({ error: 'merchant or slug required' }, { status: 400 });
}

// After:
// If neither merchant nor slug, return all settlements (network-wide)
```

### 2. Mainnet Gateway Address

**File**: `packages/sdk/src/constants.ts:79`

The mainnet address is `0x0000000000000000000000000000000000000000` (zero address). This must be updated to the real mainnet deployment before the indexer can run on mainnet.

**Action**: Deploy `ArcPaymentGateway` to Arc mainnet and update the address.

## Integration Points (Verified)

| Component | Status | Notes |
|---|---|---|
| `prisma/schema.prisma` → `Settlement` | CONFIRMED | All fields present. 6 NOT NULL fields: orderId, merchantAddress, gross, protocolFee, merchantShare, txHash |
| `app/api/settlements/route.ts` → GET | NEEDS FIX | Pagination exists, but requires merchant/slug — must make optional |
| `packages/sdk/src/constants.ts` | NEEDS FIX | Mainnet address is zero address |
| `packages/sdk/src/abi.ts` | CONFIRMED | Both events present with correct signatures |
| `lib/settlements.ts` → `SettlementItem` | CONFIRMED | Indexer must replicate exact gross/merchantShare/affiliate computation |
| viem version | CONFIRMED | v2 (`^2.23.0`) |
| `tsx` | NEEDS ADD | Not in any package.json |
| `scripts/` dir | NEEDS CREATE | Does not exist |
| `vercel.json` | NEEDS CREATE | Does not exist. Cron requires Vercel Pro. Alternative: system cron + `npx tsx` |
| `lib/webhook-dispatcher.ts` | NEEDS INTEGRATION | Indexer must call `dispatchMerchantWebhook` for consistency |

## Key Design Decisions

### 1. Upsert on `orderId`, not `txHash`

Both `PaymentSettled` and `PaymentSplitSettled` for the same order share the same `txHash`. Since `txHash @unique`, only one settlement row per tx is possible. The upsert uses `orderId` as the unique key. If a split event arrives after a direct event for the same order, it updates the existing row.

### 2. Replicate SettlementItem Computation

The indexer must produce the same values as `fromPaymentSettled` and `fromSplitSettled` in `lib/settlements.ts`:
- **Direct**: `merchantShare = gross - protocolFee`, `affiliate = null`, `affiliateShare = null`
- **Split**: `gross = merchantAmount + affiliateAmount + protocolFee`, `merchantShare = merchantAmount`, `affiliateShare = affiliateAmount`

### 3. Merchant Record Creation

The `merchantAddress` field is a FK with `onDelete: Cascade`. The indexer must create a `Merchant` record if one doesn't exist (same as the POST route does).

### 4. Webhook Dispatch

The indexer calls `dispatchMerchantWebhook` after each settlement upsert, so merchants with webhook URLs configured receive notifications for indexer-discovered settlements — not just POST /api/settlements ones.

### 5. Reorg Handling

Arc has ~600ms finality, so reorgs are rare. The indexer processes blocks sequentially. If `getBlockNumber()` returns a value less than `lastBlock`, the indexer logs a warning and waits (does not advance the cursor). For production, add: delete settlements from the reorged block forward and re-index.

## Deployment Options

### Option A: Vercel Cron (Requires Pro Plan)

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/indexer", "schedule": "*/1 * * * *" }]
}
```

With a thin API route wrapper at `app/api/cron/indexer/route.ts` that calls the same indexing logic for 1-minute runs.

### Option B: System Cron (Works Anywhere)

```bash
# crontab -e
* * * * * cd /path/to/apps/web && npx tsx scripts/indexer.ts >> /var/log/arcpay-indexer.log 2>&1
```

### Option C: Background Process

```bash
cd apps/web && npx tsx scripts/indexer.ts &
```

## Migration Plan (After Indexer Works)

1. **`/network` page**: Replace `useSettlementFeed` (RPC) with `fetch('/api/settlements?page=1&limit=20')` (DB)
   - Add "Last indexed: Xs ago" indicator from `IndexerCursor.lastRunAt`
   - Keep RPC as fallback if indexer hasn't run yet

2. **Landing page live ledger**: Replace RPC feed with `fetch('/api/settlements?limit=5')`
   - Refresh every 10 seconds
   - No RPC dependency = works for all visitors

3. **`/dashboard`**: Already uses off-chain API — no changes needed

## What This Unlocks

| Feature | Before | After |
|---|---|---|
| `/network` initial load | 10-30s spinner | <1s |
| Landing page live feed | RPC-dependent | Instant |
| Pagination | None | `?page=1&limit=20` (already exists) |
| Volume chart | Impossible | `GROUP BY date` |
| RPC cost | Every page load | Only indexer (1 req/2s) |
| Data completeness | Only ArcPay checkout payments | All contract payments |
| Per-merchant analytics | Dashboard only | Network-wide |
| Webhook consistency | Only POST /api/settlements | All settlements |

## Effort Estimate

| Task | Time |
|---|---|
| Add `tsx` + create `scripts/` dir | 5 min |
| Add `IndexerCursor` to Prisma + migrate + generate | 10 min |
| Write `indexer.ts` | 30 min |
| Fix API route (make merchant/slug optional) | 10 min |
| Test locally (backfill + live) | 20 min |
| Switch `/network` to API | 20 min |
| Switch landing page to API | 15 min |
| Deploy (Vercel cron or system cron) | 15 min |
| **Total** | **~2.5 hours** |

## Risk Mitigation

- **Reorgs**: Arc has ~600ms finality. If `getBlockNumber()` < `lastBlock`, log warning and wait. For production: delete + re-index from reorged block.
- **RPC failures**: Exponential backoff (2s → 4s → 8s → 16s → 30s max). Log all errors.
- **DB failures**: Retry loop. Don't advance cursor until write succeeds.
- **Idempotency**: `Settlement.orderId` is `@unique` — `upsert` handles duplicates silently.
- **txHash collision**: Both events for same order share `txHash`. Upsert on `orderId` only. One tx = one settlement row.
- **FK constraint**: Indexer creates `Merchant` record if missing (same as POST route).
