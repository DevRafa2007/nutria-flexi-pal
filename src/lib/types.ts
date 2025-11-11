// Types for meal and nutrition system

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type MeasurementUnit = 'g' | 'colher' | 'xícara' | 'unidade' | 'filé' | 'peito';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female';

export interface Macros {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  calories: number; // kcal
}

export interface Food {
  id?: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  macros: Macros;
  notes?: string;
}

export interface Meal {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  type: MealType;
  foods: Food[];
  totalMacros: Macros;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: Gender;
  goal: 'lose_weight' | 'gain_muscle' | 'maintain';
  activityLevel: ActivityLevel;
  allergies: string[];
  preferences: string[];
  tdee?: number;
  createdAt?: string;
}

export interface NutritionPlan {
  user_id: string;
  tdee: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  meals: Meal[];
  notes?: string;
  created_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}
