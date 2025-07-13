// src/app/auth/2fa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSPASassClient } from '@/lib/supabase/client';
import { MFAVerification } from '@/components/MFAVerification';

export default function TwoFactorAuthPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkMFAStatus();
    }, []);

    const checkMFAStatus = async () => {
        try {
            const supabase = await createSPASassClient();
            const client = supabase.getSupabaseClient();

            const { data: { user }, error: sessionError } = await client.auth.getUser();
            if (sessionError || !user) {
                router.push('/auth/login');
                return;
            }

            const { data: aal, error: aalError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();

            if (aalError) throw aalError;

            if (aal.currentLevel === 'aal2' || aal.nextLevel === 'aal1') {
                router.push('/app');
                return;
            }

            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    const handleVerified = () => {
        router.push('/app');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
            <div className="w-full max-w-md">
                <MFAVerification onVerified={handleVerified} />
            </div>
    );
}