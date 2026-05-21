'use client';

import { create } from 'zustand';

export type DisplayMode = 'masak' | 'daily' | 'belanja';

interface UiState {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
}

export const useUiStore = create<UiState>((set) => ({
  displayMode: 'daily',
  setDisplayMode: (mode) => set({ displayMode: mode }),
}));
