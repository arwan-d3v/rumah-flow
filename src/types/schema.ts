// src/types/schema.ts

export type SectionType = 'morning' | 'meals' | 'chores' | 'family' | 'self-care' | 'errands';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface CookingStage {
  id: string;
  order: number;
  name: string;
  durationMin: number;
  durationSec: number;
  instruction: string;
  autoNext: boolean;
}

export interface CookingTemplate {
  id: string;
  name: string;
  totalDurationMin: number;
  stages: CookingStage[];
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  section: SectionType;
  
  // FASE 2: Time Engine Fields
  targetDate: string; // Format ISO: YYYY-MM-DD
  recurrence: RecurrenceType;
  
  order: number;
  cookingTemplateId?: string;
  timerDurationMin?: number;
  createdAt: number; // Pakai unix timestamp agar mudah diserialisasi
  updatedAt: number;
}