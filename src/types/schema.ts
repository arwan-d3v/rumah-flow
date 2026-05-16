import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; 
  email: string;
  displayName: string;
  preferences: {
    theme: 'sage' | 'warm-sand' | 'soft-rose' | 'system';
    darkMode: boolean;
  };
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  status: 'todo' | 'in-progress' | 'completed';
  section: 'morning' | 'meals' | 'chores' | 'family' | 'self-care' | 'errands';
  date: string; // Format: YYYY-MM-DD
  order: number; 
  isRecurring: boolean;
  cookingTemplateId?: string; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CookingTemplate {
  id: string;
  userId?: string; 
  name: string;
  totalDurationMin: number;
  stages: CookingStage[];
}

export interface CookingStage {
  id: string;
  order: number;
  name: string; 
  durationMin: number;
  durationSec: number;
  instruction: string;
  autoNext: boolean; 
}