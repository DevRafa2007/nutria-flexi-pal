import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useConsumedFoods as useConsumedFoodsInternal } from '@/hooks/useConsumedFoods';
import { ConsumedFood, TotalMacros } from '@/hooks/useConsumedFoods';

interface ConsumedFoodsContextType {
    consumedFoods: ConsumedFood[];
    isLoading: boolean;
    loadConsumedFoods: (days?: number) => Promise<void>;
    markFoodConsumed: (
        mealId: string,
        foodIndex: number,
        macros: { calories: number; protein: number; carbs: number; fat: number }
    ) => Promise<void>;
    unmarkFoodConsumed: (mealId: string, foodIndex: number) => Promise<void>;
    getConsumedFoodsForDate: (date: Date) => ConsumedFood[];
    getTotalMacrosForDate: (date: Date) => TotalMacros;
    isFoodConsumedToday: (mealId: string, foodIndex: number) => boolean;
}

const ConsumedFoodsContext = createContext<ConsumedFoodsContextType | undefined>(undefined);

export function ConsumedFoodsProvider({ children }: { children: ReactNode }) {
    const consumedFoodsTracking = useConsumedFoodsInternal();

    // Carregar dados iniciais
    useEffect(() => {
        consumedFoodsTracking.loadConsumedFoods();
    }, []);

    return (
        <ConsumedFoodsContext.Provider value={consumedFoodsTracking}>
            {children}
        </ConsumedFoodsContext.Provider>
    );
}

export function useConsumedFoods() {
    const context = useContext(ConsumedFoodsContext);
    if (context === undefined) {
        throw new Error('useConsumedFoods must be used within a ConsumedFoodsProvider');
    }
    return context;
}
