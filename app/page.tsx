'use client';

import { useState, useEffect } from 'react';
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { AuthProvider } from './components/AuthProvider';
import { AppProvider } from './context/AppContext';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { SimpleAuth } from './components/SimpleAuth';
import NoSSR from './components/NoSSR';

function MainApp() {
  const { user } = useDynamicContext();
  const [useFallback, setUseFallback] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🐝</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to PayHive</h1>
          <p className="text-gray-600 mb-8">
            The easiest way to split expenses with friends using blockchain technology. 
            No crypto knowledge required!
          </p>
          
          {!useFallback ? (
            <div>
              <div className="mb-8">
                <NoSSR>
                  <DynamicWidget />
                </NoSSR>
              </div>
              
              <div className="mb-6">
                <button
                  onClick={() => setUseFallback(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Having issues? Try demo mode
                </button>
              </div>
            </div>
          ) : (
            <SimpleAuth />
          )}
          
          <div className="text-sm text-gray-500 space-y-2 mt-8">
            <p>🔐 Secure wallet creation</p>
            <p>💰 PYUSD settlements</p>
            <p>📱 Mobile-friendly design</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NoSSR>
      <AuthenticatedApp />
    </NoSSR>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}

