import crypto from 'crypto';
import { prisma } from './db';

export interface WebhookEventPayload {
  id: string;
  event: 'payment.settled' | 'payment.failed' | 'payment.split_settled';
  created: number;
  data: {
    orderId: string;
    txHash: string;
    blockNumber: string;
    merchant: string;
    payer: string | null;
    grossUsdc: string;
    protocolFeeUsdc: string;
    merchantShareUsdc: string;
    affiliate?: string | null;
    affiliateShareUsdc?: string | null;
    payLinkSlug?: string | null;
    planName?: string | null;
    buyerEmail?: string | null;
    buyerHandle?: string | null;
    metadata?: Record<string, unknown> | string | null;
  };
}

/**
 * Creates a Stripe-compatible signature header: `t=timestamp,v1=signature`
 */
export function signWebhookPayload(payloadStr: string, secret: string): { header: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');

  return {
    header: `t=${timestamp},v1=${signature}`,
    timestamp,
  };
}

/**
 * Dispatches a signed webhook payload to the merchant's configured webhook URL
 * and records the delivery result in PostgreSQL.
 */
export async function dispatchMerchantWebhook(
  merchantAddress: string,
  event: WebhookEventPayload['event'],
  data: WebhookEventPayload['data']
) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { address: merchantAddress.toLowerCase() },
    });

    if (!merchant || !merchant.webhookUrl || !merchant.webhookSecret) {
      return null;
    }

    const payload: WebhookEventPayload = {
      id: `evt_${crypto.randomBytes(12).toString('hex')}`,
      event,
      created: Math.floor(Date.now() / 1000),
      data,
    };

    const payloadString = JSON.stringify(payload);
    const { header } = signWebhookPayload(payloadString, merchant.webhookSecret);

    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let status: 'success' | 'failed' = 'failed';

    try {
      const response = await fetch(merchant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Arc-Signature': header,
          'User-Agent': 'ArcPay-Webhook-Dispatcher/1.0',
        },
        body: payloadString,
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      statusCode = response.status;
      const text = await response.text();
      responseBody = text.slice(0, 1000); // store up to 1KB of response
      status = response.ok ? 'success' : 'failed';
    } catch (err: unknown) {
      const error = err as Error;
      responseBody = error.message;
      status = 'failed';
    }

    // Persist delivery log in PostgreSQL
    const delivery = await prisma.webhookDelivery.create({
      data: {
        merchantAddress: merchant.address,
        event,
        payload: payloadString,
        status,
        statusCode,
        responseBody,
        attempts: 1,
      },
    });

    return delivery;
  } catch (error) {
    console.error('Failed to dispatch webhook:', error);
    return null;
  }
}
