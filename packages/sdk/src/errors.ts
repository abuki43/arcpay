/**
 * Human-readable errors for checkout failures.
 *
 * viem and injected wallets produce errors carrying the full RPC URL, the raw
 * calldata hex, call arguments and a version string. Those are useful in the
 * console and actively harmful in a payment modal, where a wall of hex reads as
 * a broken product. This module maps known failure signatures onto short
 * copy, while preserving the original on `cause` so nothing is lost.
 */

/** Wallet-level rejection. EIP-1193 code 4001. */
const USER_REJECTED = /user (rejected|denied|cancell?ed)|request rejected|code 4001|4001/i;

/** Network / transport failures, which are usually transient. */
const NETWORK =
  /failed to fetch|fetch failed|http request failed|econnrefused|econnreset|etimedout|timeout|socket hang up|network ?error|load failed|aborted/i;

/** Custom errors raised by ArcPaymentGateway. */
const REVERT_PATTERNS: Array<[RegExp, string]> = [
  [/PaymentAlreadySettled/, 'This order has already been paid.'],
  [/InvalidSplitAmounts/, 'The payment split does not add up to the total.'],
  [/InvalidAffiliate/, 'The affiliate address is not valid.'],
  [/InvalidMerchant/, 'The merchant address is not valid.'],
  [/InvalidAmount/, 'The payment amount must be greater than zero.'],
  [/TransferFailed/, 'The transfer to the merchant failed.'],
  [/ReentrancyGuardReentrantCall/, 'The payment was rejected. Please try again.'],
];

const EXECUTION_FAILED =
  /execution reverted|revert(?:ed)?|transaction failed|invalid opcode|out of gas/i;

const INSUFFICIENT_FUNDS =
  /insufficient funds|exceeds balance|balance too low|gas required exceeds|intrinsic gas too low|would leave account/i;

/** Extract the deepest message a provider or viem attached. */
function deepestMessage(err: unknown, depth = 0): string {
  if (!err || depth > 6) return '';
  if (typeof err === 'string') return err;

  const e = err as {
    message?: unknown;
    shortMessage?: unknown;
    cause?: unknown;
    data?: { message?: unknown };
  };

  const own = [e.shortMessage, e.message, e.data?.message]
    .filter((v): v is string => typeof v === 'string')
    .join(' ');

  const nested = deepestMessage(e.cause, depth + 1);
  return `${own} ${nested}`.trim();
}

function extractCode(err: unknown, depth = 0): number | undefined {
  if (!err || depth > 6 || typeof err !== 'object') return undefined;
  const e = err as { code?: unknown; cause?: unknown };
  if (typeof e.code === 'number') return e.code;
  return extractCode(e.cause, depth + 1);
}

/**
 * The receipt guard tags its own error rather than relying on the message
 * alone, since the message is short copy the matcher cannot key off of.
 */
function isPendingConfirmation(err: unknown, depth = 0): boolean {
  if (!err || depth > 6 || typeof err !== 'object') return false;
  const e = err as { isPendingConfirmation?: unknown; cause?: unknown };
  if (e.isPendingConfirmation === true) return true;
  return isPendingConfirmation(e.cause, depth + 1);
}

/**
 * Turns any checkout failure into a short, human-readable Error.
 *
 * The original error is preserved on `cause`, so callers can still inspect it.
 * Callers should `console.error` the original if they want the full trace.
 */
export function humanizeCheckoutError(err: unknown): Error {
  if (err instanceof Error && (err as Error & { humanized?: boolean }).humanized) {
    return err;
  }

  const haystack = deepestMessage(err);
  const code = extractCode(err);
  const combined = `${haystack} ${code !== undefined ? code : ''}`;

  const short = (message: string): Error => {
    const next = new Error(message);
    (next as Error & { humanized?: boolean }).humanized = true;
    (next as Error & { cause?: unknown }).cause = err;
    return next;
  };

  // Must precede NETWORK: viem's receipt timeout says "Timed out while waiting
  // for transaction", which NETWORK matches. A payment whose receipt merely has
  // not been indexed yet must never read as failed, or the user may pay twice.
  const PENDING_CONFIRMATION =
    /TransactionReceiptNotFoundError|WaitForTransactionReceiptTimeoutError|still confirming on arc/i;

  if (PENDING_CONFIRMATION.test(combined) || isPendingConfirmation(err)) {
    return short(
      'Still confirming on Arc. Your payment was submitted — check the explorer before paying again.',
    );
  }

  if (USER_REJECTED.test(combined)) {
    return short('You cancelled the payment.');
  }

  if (INSUFFICIENT_FUNDS.test(combined)) {
    return short('Not enough USDC in this wallet to cover the payment and gas.');
  }

  for (const [pattern, message] of REVERT_PATTERNS) {
    if (pattern.test(combined)) return short(message);
  }

  if (NETWORK.test(combined)) {
    return short("Couldn't reach Arc. Check your connection and try again.");
  }

  if (EXECUTION_FAILED.test(combined)) {
    return short('The transaction reverted on Arc.');
  }

  // viem's receipt timeout shares the word "transaction" with real reverts,
  // so it must be matched before them or a pending payment reads as failed.
  return short('Payment failed. Please try again.');
}