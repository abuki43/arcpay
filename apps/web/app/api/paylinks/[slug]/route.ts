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
        merchant: {
          select: { address: true, name: true },
        },
        plans: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!payLink) {
      return NextResponse.json({ error: 'PayLink not found' }, { status: 404 });
    }

    // Increment views counter asynchronously (non-blocking)
    prisma.payLink
      .update({
        where: { id: payLink.id },
        data: { views: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json({
      payLink: {
        ...payLink,
        plans: payLink.plans.map((p) => ({
          ...p,
          features: JSON.parse(p.features || '[]'),
        })),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { active, title, description, redirectUrl } = body;

    const updated = await prisma.payLink.update({
      where: { slug: slug.toLowerCase() },
      data: {
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(redirectUrl !== undefined ? { redirectUrl } : {}),
      },
    });

    return NextResponse.json({ payLink: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
