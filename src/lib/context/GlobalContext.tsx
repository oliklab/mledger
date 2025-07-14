// src/lib/context/GlobalContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSPASassClient } from '@/lib/supabase/client';
import { UserProfile } from '@/models/profiles';


type User = {
  email: string;
  id: string;
  registered_at: Date;
  profile: UserProfile;
};

interface GlobalContextType {
  loading: boolean;
  user: User | null;  // Add this
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);  // Add this

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = await createSPASassClient();
        const client = supabase.getSupabaseClient();

        // Get user data
        const { data: { user: authUser } } = await client.auth.getUser();

        if (authUser) {
          const { data: profileData, error: profileError } = await client
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profileError) throw profileError;

          setUser({
            email: authUser.email!,
            id: authUser.id,
            registered_at: new Date(authUser.created_at),
            profile: profileData as UserProfile,
          });
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

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};