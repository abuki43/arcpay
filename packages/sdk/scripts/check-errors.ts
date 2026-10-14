import { humanizeCheckoutError } from '../src/errors';

const cases: Array<[string, unknown, string]> = [
  [
    'real browser failure (viem wrap)',
    Object.assign(
      new Error(
        'HTTP request failed. URL: https://rpc.mainnet.arc.io/ Request body: {"method":"eth_call","params":[{"data":"0xc196fcd79c8e9521131356545511b6b9fbaa6fa0fef840de2af288f22c70ab25be55984f0000..."}]} Raw Call Arguments: from: 0xd04DaF41 to: 0x6A1aAc76 value: 0.1 USDC Contract Call: address: 0x6A1aAc76 function: payNative(bytes32 orderId, address merchant, string metadata) Details: Failed to fetch Version: viem@2.56.8',
      ),
      { cause: new Error('Failed to fetch') },
    ),
    "Couldn't reach Arc. Check your connection and try again.",
  ],
  [
    'user rejects in MetaMask',
    Object.assign(new Error('User rejected the request.'), { code: 4001 }),
    'You cancelled the payment.',
  ],
  [
    'nonce/duplicate order',
    new Error('execution reverted: PaymentAlreadySettled(0x9c8e95)'),
    'This order has already been paid.',
  ],
  ['zero amount', new Error('execution reverted: InvalidAmount()'), 'The payment amount must be greater than zero.'],
  ['bad merchant', new Error('reverted InvalidMerchant()'), 'The merchant address is not valid.'],
  ['transfer failed', new Error('reverted: TransferFailed(0xabc, 1)'), 'The transfer to the merchant failed.'],
  ['insufficient funds', new Error('insufficient funds for gas * price + value'), 'Not enough USDC in this wallet to cover the payment and gas.'],
  ['split mismatch', new Error('reverted InvalidSplitAmounts(1,2,3)'), 'The payment split does not add up to the total.'],
  ['generic revert', new Error('execution reverted: unknown selector'), 'The transaction reverted on Arc.'],
  ['unknown', new Error('something bizarre happened'), 'Payment failed. Please try again.'],
  [
    'nested viem cause chain',
    Object.assign(new Error('ContractFunctionExecutionError'), {
      cause: Object.assign(new Error('Transaction execution reverted'), {
        cause: new Error('InvalidAmount()'),
      }),
    }),
    'The payment amount must be greater than zero.',
  ],
  [
    'timeout',
    new Error('HTTP request failed. Details: request timed out after 10000ms'),
    "Couldn't reach Arc. Check your connection and try again.",
  ],
];

let failures = 0;
for (const [name, input, expected] of cases) {
  const got = humanizeCheckoutError(input).message;
  const ok = got === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}\n      got: ${got}${ok ? '' : `\n      want: ${expected}`}`);
}

// idempotency: humanizing twice must not double-wrap
const once = humanizeCheckoutError(new Error('User rejected the request.'));
const twice = humanizeCheckoutError(once);
const idem = twice === once;
if (!idem) failures++;
console.log(`${idem ? 'PASS' : 'FAIL'}  idempotent (no double-wrap)`);

console.log(failures === 0 ? '\nall cases passed' : `\n${failures} case(s) failed`);
process.exit(failures === 0 ? 0 : 1);