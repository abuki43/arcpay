import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { dispatchMerchantWebhook } from '@/lib/webhook-dispatcher';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchant = searchParams.get('merchant')?.toLowerCase();

    if (!merchant) {
      return NextResponse.json({ error: 'merchant parameter required' }, { status: 400 });
    }

    const merchantRecord = await prisma.merchant.findUnique({
      where: { address: merchant },
      include: {
        webhookEvents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!merchantRecord) {
      return NextResponse.json({
        webhookUrl: null,
        webhookSecret: null,
        deliveries: [],
      });
    }

    return NextResponse.json({
      webhookUrl: merchantRecord.webhookUrl,
      webhookSecret: merchantRecord.webhookSecret,
      deliveries: merchantRecord.webhookEvents.map((d) => ({
        id: d.id,
        event: d.event,
        status: d.status,
        statusCode: d.statusCode,
        responseBody: d.responseBody,
        payload: JSON.parse(d.payload),
        createdAt: d.createdAt,
      })),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantAddress, webhookUrl, regenerateSecret } = body;

    if (!merchantAddress) {
      return NextResponse.json({ error: 'merchantAddress required' }, { status: 400 });
    }

    const cleanMerchant = merchantAddress.toLowerCase();
    const current = await prisma.merchant.findUnique({ where: { address: cleanMerchant } });

    let secret = current?.webhookSecret;
    if (!secret || regenerateSecret) {
      secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    }

    const updated = await prisma.merchant.upsert({
      where: { address: cleanMerchant },
      update: {
        webhookUrl: webhookUrl || null,
        webhookSecret: secret,
      },
      create: {
        address: cleanMerchant,
        webhookUrl: webhookUrl || null,
        webhookSecret: secret,
      },
    });

    return NextResponse.json({
      webhookUrl: updated.webhookUrl,
      webhookSecret: updated.webhookSecret,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantAddress } = body;

    if (!merchantAddress) {
      return NextResponse.json({ error: 'merchantAddress required' }, { status: 400 });
    }

    const cleanMerchant = merchantAddress.toLowerCase();

    const delivery = await dispatchMerchantWebhook(
      cleanMerchant,
      'payment.settled',
      {
        orderId: `0x${crypto.randomBytes(32).toString('hex')}`,
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        blockNumber: '64120000',
        merchant: cleanMerchant,
        payer: '0x1111111111111111111111111111111111111111',
        grossUsdc: '29.00',
        protocolFeeUsdc: '0.12',
        merchantShareUsdc: '28.88',
        payLinkSlug: 'test-ping-link',
        planName: 'Pro Plan',
        buyerEmail: 'customer@example.com',
        metadata: { test: true, triggeredAt: new Date().toISOString() },
      }
    );

    return NextResponse.json({
      success: true,
      delivery,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
