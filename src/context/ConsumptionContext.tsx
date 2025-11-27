import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useConsumptionTrackingInternal } from '@/hooks/useConsumptionTrackingInternal';
import { DailyConsumption, UserStreak } from '@/hooks/useConsumptionTrackingInternal';

interface ConsumptionContextType {
    streak: UserStreak | null;
    consumptions: DailyConsumption[];
    isLoading: boolean;
    loadStreak: () => Promise<void>;
    loadConsumptions: (days?: number) => Promise<void>;
    markMealConsumed: (mealId: string, macrosMet?: number) => Promise<void>;
    unmarkMealConsumed: (mealId: string) => Promise<void>;
    updateStreak: () => Promise<void>;
    getConsumptionsByDate: (date: Date) => DailyConsumption[];
    hasDayActivity: (date: Date) => boolean;
}

const ConsumptionContext = createContext<ConsumptionContextType | undefined>(undefined);

export function ConsumptionProvider({ children }: { children: ReactNode }) {
    const consumptionTracking = useConsumptionTrackingInternal();

    // Carregar dados iniciais
    useEffect(() => {
        consumptionTracking.loadStreak();
        consumptionTracking.loadConsumptions();
    }, []);

    return (
        <ConsumptionContext.Provider value={consumptionTracking}>
            {children}
        </ConsumptionContext.Provider>
    );
}

export function useConsumptionTracking() {
    const context = useContext(ConsumptionContext);
    if (context === undefined) {
        throw new Error('useConsumptionTracking must be used within a ConsumptionProvider');
    }
    return context;
}
