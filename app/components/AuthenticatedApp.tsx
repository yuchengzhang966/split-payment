'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useApp } from '../context/AppContext';
import { DashboardPage } from './DashboardPage';

export function AuthenticatedApp() {
  const { user: dynamicUser, primaryWallet } = useDynamicContext();
  const { user, setUser } = useApp();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (dynamicUser && primaryWallet) {
      setUser({
        id: dynamicUser.userId || `user_${Date.now()}`,
        email: dynamicUser.email,
        name: dynamicUser.firstName ? `${dynamicUser.firstName} ${dynamicUser.lastName || ''}`.trim() : dynamicUser.email,
        walletAddress: primaryWallet.address,
      });
    } else {
      setUser(null);
    }
  }, [dynamicUser, primaryWallet, setUser]);

  // Show loading state during hydration
  if (!isHydrated) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your account...</p>
      </div>
    );
  }

  return <DashboardPage />;
}
