'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to safely detect if we're running on the client side
 * Helps prevent hydration mismatches
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
