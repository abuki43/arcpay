import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchant = searchParams.get('merchant')?.toLowerCase();

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant address required' }, { status: 400 });
    }

    const payLinks = await prisma.payLink.findMany({
      where: { merchantAddress: merchant },
      include: {
        plans: {
          orderBy: { orderIndex: 'asc' },
        },
        settlements: {
          select: {
            id: true,
            gross: true,
            merchantShare: true,
            status: true,
            timestamp: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = payLinks.map((link) => {
      const settledOrders = link.settlements.filter((s) => s.status === 'settled');
      const grossWeiTotal = settledOrders.reduce((acc, s) => acc + BigInt(s.gross), 0n);
      const grossUsdc = Number(grossWeiTotal) / 1e18;

      return {
        id: link.id,
        slug: link.slug,
        title: link.title,
        description: link.description,
        type: link.type,
        amount: link.amount,
        active: link.active,
        views: link.views,
        redirectUrl: link.redirectUrl,
        collectEmail: link.collectEmail,
        collectDiscord: link.collectDiscord,
        customNote: link.customNote,
        affiliateAddress: link.affiliateAddress,
        affiliateBps: link.affiliateBps,
        createdAt: link.createdAt,
        plans: link.plans.map((p) => ({
          id: p.id,
          name: p.name,
          tag: p.tag,
          amount: p.amount,
          interval: p.interval,
          description: p.description,
          features: JSON.parse(p.features || '[]'),
          featured: p.featured,
        })),
        stats: {
          totalOrders: settledOrders.length,
          grossVolumeUsdc: grossUsdc,
          conversionRate: link.views > 0 ? (settledOrders.length / link.views) * 100 : 0,
        },
      };
    });

    return NextResponse.json({ payLinks: formatted });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchantAddress,
      title,
      description,
      type = 'single_item',
      amount,
      slug: requestedSlug,
      redirectUrl,
      collectEmail = false,
      collectDiscord = false,
      customNote,
      affiliateAddress,
      affiliateBps,
      plans = [],
    } = body;

    if (!merchantAddress || !title) {
      return NextResponse.json(
        { error: 'merchantAddress and title are required' },
        { status: 400 }
      );
    }

    const cleanMerchant = merchantAddress.toLowerCase();

    // Ensure merchant row exists
    await prisma.merchant.upsert({
      where: { address: cleanMerchant },
      update: {},
      create: { address: cleanMerchant },
    });

    // Generate unique slug if not provided or format custom slug
    let slug = requestedSlug
      ? requestedSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);

    const existingSlug = await prisma.payLink.findUnique({ where: { slug } });
    if (existingSlug || !slug) {
      const suffix = Math.random().toString(36).substring(2, 7);
      slug = slug ? `${slug}-${suffix}` : `pl-${suffix}`;
    }

    const payLink = await prisma.payLink.create({
      data: {
        slug,
        merchantAddress: cleanMerchant,
        title,
        description,
        type,
        amount: type === 'single_item' ? parseFloat(amount) || 0 : null,
        redirectUrl,
        collectEmail: Boolean(collectEmail),
        collectDiscord: Boolean(collectDiscord),
        customNote,
        affiliateAddress: affiliateAddress ? affiliateAddress.toLowerCase() : null,
        affiliateBps: affiliateBps ? parseInt(affiliateBps, 10) : null,
        plans: {
          create: type === 'multi_plan'
            ? plans.map((p: any, idx: number) => ({
                name: p.name,
                tag: p.tag || null,
                amount: parseFloat(p.amount) || 0,
                interval: p.interval || 'month',
                description: p.description || null,
                features: JSON.stringify(p.features || []),
                orderIndex: idx,
                featured: Boolean(p.featured),
              }))
            : [],
        },
      },
      include: {
        plans: true,
      },
    });

    return NextResponse.json({ payLink }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
