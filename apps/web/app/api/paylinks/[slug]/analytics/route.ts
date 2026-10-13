import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const payLink = await prisma.payLink.findFirst({
      where: {
        OR: [{ slug: slug.toLowerCase() }, { id: slug }],
      },
      include: {
        plans: true,
        settlements: {
          orderBy: { timestamp: 'desc' },
          take: 50,
          include: {
            plan: true,
          },
        },
      },
    });

    if (!payLink) {
      return NextResponse.json({ error: 'PayLink not found' }, { status: 404 });
    }

    const settledList = payLink.settlements.filter((s) => s.status === 'settled');
    const totalGrossWei = settledList.reduce((acc, s) => acc + BigInt(s.gross), 0n);
    const totalNetWei = settledList.reduce((acc, s) => acc + BigInt(s.merchantShare), 0n);
    const totalFeeWei = settledList.reduce((acc, s) => acc + BigInt(s.protocolFee), 0n);

    // Plan breakdown
    const planBreakdown = payLink.plans.map((p) => {
      const planOrders = settledList.filter((s) => s.planId === p.id);
      const planGrossWei = planOrders.reduce((acc, s) => acc + BigInt(s.gross), 0n);
      return {
        planId: p.id,
        name: p.name,
        tag: p.tag,
        price: p.amount,
        ordersCount: planOrders.length,
        volumeUsdc: (Number(planGrossWei) / 1e18).toFixed(2),
      };
    });

    return NextResponse.json({
      analytics: {
        payLinkId: payLink.id,
        slug: payLink.slug,
        title: payLink.title,
        type: payLink.type,
        views: payLink.views,
        ordersCount: settledList.length,
        conversionRate: payLink.views > 0 ? (settledList.length / payLink.views) * 100 : 0,
        grossVolumeUsdc: (Number(totalGrossWei) / 1e18).toFixed(2),
        netVolumeUsdc: (Number(totalNetWei) / 1e18).toFixed(2),
        protocolFeeUsdc: (Number(totalFeeWei) / 1e18).toFixed(2),
        planBreakdown,
        recentSettlements: payLink.settlements.map((s) => ({
          id: s.id,
          orderId: s.orderId,
          payer: s.payerAddress,
          planName: s.plan?.name || null,
          gross: (Number(BigInt(s.gross)) / 1e18).toFixed(2),
          merchantShare: (Number(BigInt(s.merchantShare)) / 1e18).toFixed(2),
          fee: (Number(BigInt(s.protocolFee)) / 1e18).toFixed(2),
          txHash: s.txHash,
          buyerEmail: s.buyerEmail,
          buyerHandle: s.buyerHandle,
          timestamp: s.timestamp,
        })),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
