'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        },
      }}
    />
  );
}
