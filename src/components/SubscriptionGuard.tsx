"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UseUserContext } from '@/lib/context/GlobalContext';

// This component wraps your protected routes
export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = UseUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const subscription = user?.subscription;


  useEffect(() => {
    // Wait until the user and subscription data has finished loading
    if (loading) {
      return;
    }

    // Define the pages that do NOT require a subscription
    const allowedPaths = [
      '/app',
      '/app/payments',
      '/app/payments/pricing',
      '/app/profile'];

    // Check if the user is logged in but has no active subscription
    const status = subscription?.status;
    const hasActiveSubscription = status === 'active' || status === 'trialing';

    if (user && !hasActiveSubscription && !allowedPaths.includes(pathname)) {
      router.push('/app/payments');
    }
  }, [user, subscription, loading, pathname, router]);

  // While loading, you can show a loader or nothing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If checks pass, render the actual page content
  return <>{children}</>;
}