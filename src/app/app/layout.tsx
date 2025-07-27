// src/app/app/layout.tsx
import AppLayout from '@/components/AppLayout';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalProvider>
      <SubscriptionGuard>
        <AppLayout>{children}</AppLayout>
      </SubscriptionGuard>
    </GlobalProvider>
  );
}