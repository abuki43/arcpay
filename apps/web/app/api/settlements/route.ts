import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  ARC_PAYMENT_GATEWAY_ABI,
  DEFAULT_GATEWAY_ADDRESSES,
  arcTestnet,
  arcMainnet,
} from '@arcpay/sdk';
import { dispatchMerchantWebhook } from '@/lib/webhook-dispatcher';
import { createPublicClient, http, type Hash, type Address } from 'viem';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchant = searchParams.get('merchant')?.toLowerCase();
    const payLinkSlug = searchParams.get('slug')?.toLowerCase();
    const search = searchParams.get('search')?.trim().toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const where: any = {};
    if (merchant) where.merchantAddress = merchant;
    if (payLinkSlug) where.payLinkId = payLinkSlug;

    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { payerAddress: { contains: search, mode: 'insensitive' } },
        { txHash: { contains: search, mode: 'insensitive' } },
        { buyerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, settlements] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          payLink: {
            select: { title: true, slug: true, type: true },
          },
          plan: {
            select: { name: true, tag: true },
          },
        },
      }),
    ]);

    const formatted = settlements.map((s) => ({
      id: s.id,
      orderId: s.orderId,
      merchant: s.merchantAddress,
      payer: s.payerAddress,
      payLinkTitle: s.payLink?.title || null,
      payLinkSlug: s.payLink?.slug || null,
      planName: s.plan?.name || null,
      gross: s.gross,
      protocolFee: s.protocolFee,
      merchantShare: s.merchantShare,
      affiliate: s.affiliateAddress,
      affiliateShare: s.affiliateShare,
      kind: s.kind,
      txHash: s.txHash,
      blockNumber: s.blockNumber.toString(),
      buyerEmail: s.buyerEmail,
      buyerHandle: s.buyerHandle,
      metadata: s.metadata ? JSON.parse(s.metadata) : null,
      status: s.status,
      timestamp: s.timestamp.getTime(),
    }));

    return NextResponse.json({
      settlements: formatted,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      txHash,
      orderId,
      slug,
      planId,
      buyerEmail,
      buyerHandle,
      chainId = 5042002,
      metadata,
    } = body;

    if (!txHash || !orderId) {
      return NextResponse.json({ error: 'txHash and orderId are required' }, { status: 400 });
    }

    // Check if already processed
    const existing = await prisma.settlement.findUnique({
      where: { orderId },
    });
    if (existing) {
      return NextResponse.json({ settlement: existing, alreadyProcessed: true });
    }

    // 1. Cryptographic Verification on Arc RPC
    const targetChain = chainId === 5042 ? arcMainnet : arcTestnet;
    const rpcUrl = chainId === 5042
      ? (process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || targetChain.rpcUrls.default.http[0])
      : (process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || targetChain.rpcUrls.default.http[0]);

    const publicClient = createPublicClient({
      chain: targetChain,
      transport: http(rpcUrl),
    });

    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as Hash,
    });

    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json(
        { error: 'Transaction unconfirmed or reverted on Arc' },
        { status: 400 }
      );
    }

    // Read payment record directly from ArcPaymentGateway contract
    const gatewayAddress =
      (DEFAULT_GATEWAY_ADDRESSES as Record<number, `0x${string}`>)[chainId] ||
      DEFAULT_GATEWAY_ADDRESSES[5042002];

    const paymentRecord = await publicClient.readContract({
      address: gatewayAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'getPayment',
      args: [orderId as `0x${string}`],
    });

    if (!paymentRecord || !paymentRecord.isSettled) {
      return NextResponse.json(
        { error: 'Order is not marked settled on ArcPaymentGateway' },
        { status: 400 }
      );
    }

    const merchantAddress = paymentRecord.merchant.toLowerCase();
    const grossBigInt = paymentRecord.amount;
    const feeBigInt = paymentRecord.protocolFee || 0n;
    const netBigInt = grossBigInt - feeBigInt;

    // Ensure merchant exists in DB
    await prisma.merchant.upsert({
      where: { address: merchantAddress },
      update: {},
      create: { address: merchantAddress },
    });

    // Check if associated with a PayLink
    let payLink = null;
    if (slug) {
      payLink = await prisma.payLink.findFirst({
        where: { OR: [{ slug: slug.toLowerCase() }, { id: slug }] },
      });
    }

    // Save Settlement record
    const settlement = await prisma.settlement.create({
      data: {
        orderId,
        merchantAddress,
        payerAddress: paymentRecord.payer ? paymentRecord.payer.toLowerCase() : null,
        payLinkId: payLink ? payLink.slug : null,
        planId: planId || null,
        gross: grossBigInt.toString(),
        protocolFee: feeBigInt.toString(),
        merchantShare: netBigInt.toString(),
        kind: 'direct',
        txHash,
        blockNumber: receipt.blockNumber,
        buyerEmail: buyerEmail || null,
        buyerHandle: buyerHandle || null,
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
        status: 'settled',
        timestamp: new Date(Number(paymentRecord.timestamp || BigInt(Math.floor(Date.now() / 1000))) * 1000),
      },
      include: {
        payLink: true,
        plan: true,
      },
    });

    // Dispatch webhook to merchant server asynchronously
    const grossFormatted = (Number(grossBigInt) / 1e18).toFixed(2);
    const feeFormatted = (Number(feeBigInt) / 1e18).toFixed(2);
    const netFormatted = (Number(netBigInt) / 1e18).toFixed(2);

    dispatchMerchantWebhook(
      merchantAddress,
      'payment.settled',
      {
        orderId,
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        merchant: merchantAddress,
        payer: paymentRecord.payer || null,
        grossUsdc: grossFormatted,
        protocolFeeUsdc: feeFormatted,
        merchantShareUsdc: netFormatted,
        payLinkSlug: payLink ? payLink.slug : null,
        planName: settlement.plan?.name || null,
        buyerEmail: buyerEmail || null,
        buyerHandle: buyerHandle || null,
        metadata: metadata || null,
      }
    ).catch((err) => console.error('Webhook async dispatch error:', err));

    return NextResponse.json({
      settlement: {
        ...settlement,
        blockNumber: settlement.blockNumber.toString(),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
