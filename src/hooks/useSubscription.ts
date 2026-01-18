import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface UsageStats {
    plan: 'free' | 'basic' | 'pro' | 'premium';
    usage_count: number;
    usage_limit: number;
    subscription_status?: string;
    current_period_end: string | null;
}

export function useSubscription() {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchUsage = async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_usage');
            if (error) {
                console.warn('Erro ao carregar status da assinatura:', error);
                throw error;
            }
            setStats(data as UsageStats);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
        // Atualiza a cada 30 segundos para manter sync
        const interval = setInterval(fetchUsage, 30000);
        return () => clearInterval(interval);
    }, []);

    return {
        stats,
        loading,
        error,
        refetch: fetchUsage,
        isFree: stats?.plan === 'free',
        isUnlimited: stats?.usage_limit === -1,
    };
}
