'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NewSPASassClient } from '@/lib/supabase/client';
import { AuthStore, AuthUser } from '@/storage/auth';

interface GlobalContextType {
  loading: boolean;
  user: AuthUser | null;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = await NewSPASassClient();
        const auth = new AuthStore(supabase);

        const authUser = await auth.GetAuthenticatedUser();
        if (authUser) {
          setUser(authUser);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <GlobalContext.Provider value={{ loading, user }}>
      {children}
    </GlobalContext.Provider>
  );
}

export const UseUserContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};