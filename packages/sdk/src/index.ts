/**
 * @package @arcpay/sdk
 * Developer-first payment SDK for Arc Network (Circle Layer-1 Blockchain)
 */

// Core Constants & Chains
export * from './constants';

// TypeScript Types
export * from './types';

// ABI Constants
export * from './abi';

// Client Utilities & Math
export * from './utils';

// ArcPay Client Class
export * from './client';

// Server-side Verification Engine
export * from './server';

// NOTE: the universal web component is deliberately NOT re-exported here.
// `@arcpay/sdk/element` registers <arc-pay-button> as a side effect and pulls
// the qrcode dependency in with it. Exporting it from the barrel meant anyone
// importing a string helper also dragged the DOM component into their bundle.
// Import it explicitly from '@arcpay/sdk/element' instead.

// Wallet Discovery & Chain Switching
export * from './wallet';

export const SDK_VERSION = '0.3.0';
