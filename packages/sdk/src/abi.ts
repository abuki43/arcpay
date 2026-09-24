export const ARC_PAYMENT_GATEWAY_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_feeRecipient', type: 'address', internalType: 'address payable' },
      { name: '_feeBps', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'BPS_DIVISOR',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'MAX_FEE_BPS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'calculateFee',
    inputs: [{ name: 'grossAmount', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'protocolFee', type: 'uint256', internalType: 'uint256' },
      { name: 'netAmount', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'feeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'feeRecipient',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address payable' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getPayment',
    inputs: [{ name: 'orderId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct ArcPaymentGateway.PaymentRecord',
        components: [
          { name: 'orderId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'merchant', type: 'address', internalType: 'address' },
          { name: 'payer', type: 'address', internalType: 'address' },
          { name: 'token', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'protocolFee', type: 'uint256', internalType: 'uint256' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'isSettled', type: 'bool', internalType: 'bool' },
          { name: 'metadata', type: 'string', internalType: 'string' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'isOrderPaid',
    inputs: [{ name: 'orderId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'merchantTransactionCount',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'merchantVolume',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'payNative',
    inputs: [
      { name: 'orderId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'merchant', type: 'address', internalType: 'address payable' },
      { name: 'metadata', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'payNativeWithSplit',
    inputs: [
      { name: 'orderId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'merchant', type: 'address', internalType: 'address payable' },
      { name: 'merchantAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'affiliate', type: 'address', internalType: 'address payable' },
      { name: 'affiliateAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'metadata', type: 'string', internalType: 'string' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'payments',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'orderId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'merchant', type: 'address', internalType: 'address' },
      { name: 'payer', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'protocolFee', type: 'uint256', internalType: 'uint256' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'isSettled', type: 'bool', internalType: 'bool' },
      { name: 'metadata', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'setFeeConfig',
    inputs: [
      { name: '_feeBps', type: 'uint256', internalType: 'uint256' },
      { name: '_feeRecipient', type: 'address', internalType: 'address payable' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'totalProtocolFees',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalTransactions',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalVolume',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'FeeConfigUpdated',
    inputs: [
      { name: 'oldFeeBps', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newFeeBps', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'oldFeeRecipient', type: 'address', indexed: false, internalType: 'address' },
      { name: 'newFeeRecipient', type: 'address', indexed: false, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PaymentSettled',
    inputs: [
      { name: 'orderId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'payer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'protocolFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'metadata', type: 'string', indexed: false, internalType: 'string' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'PaymentSplitSettled',
    inputs: [
      { name: 'orderId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'affiliate', type: 'address', indexed: true, internalType: 'address' },
      { name: 'payer', type: 'address', indexed: false, internalType: 'address' },
      { name: 'merchantAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'affiliateAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'protocolFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'metadata', type: 'string', indexed: false, internalType: 'string' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'error',
    name: 'InvalidAffiliate',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidFeeBps',
    inputs: [
      { name: 'requestedBps', type: 'uint256', internalType: 'uint256' },
      { name: 'maxBps', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'InvalidMerchant',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidRecipient',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidSplitAmounts',
    inputs: [
      { name: 'merchantAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'affiliateAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'netAmount', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'PaymentAlreadySettled',
    inputs: [{ name: 'orderId', type: 'bytes32', internalType: 'bytes32' }]
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: []
  },
  {
    type: 'error',
    name: 'TransferFailed',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    type: 'error',
    name: 'Unauthorized',
    inputs: []
  }
] as const;
