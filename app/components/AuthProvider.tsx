'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // If no environment ID is set, show a setup message
  if (!process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-6">
            Please set your Dynamic Environment ID in the <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file.
          </p>
          <div className="text-left bg-gray-100 p-4 rounded-lg">
            <p className="text-sm font-mono">NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_id_here</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Get your Environment ID from{' '}
            <a href="https://app.dynamic.xyz/dashboard/developer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Dynamic Dashboard
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        appName: 'PayHive',
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
