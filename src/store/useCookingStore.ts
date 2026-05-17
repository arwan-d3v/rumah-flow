import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CookingTemplate } from '@/types/schema';
import { playStartSound, playWarningSound, playTickSound, playEndSound } from '@/lib/audio'; // IMPOR 3 SUARA BARU
import { toast } from 'sonner';

interface CookingState {
  activeTemplate: CookingTemplate | null;
  currentStageIndex: number;
  remainingSeconds: number;
  isRunning: boolean;
  lastUpdated: number;
  
  customizingTemplateId: string | null;
  setCustomizingTemplateId: (id: string | null) => void;
  
  startSession: (template: CookingTemplate) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  nextStage: () => void;
  tick: () => void;
  syncOfflineTime: () => void;
}

export const useCookingStore = create<CookingState>()(
  persist(
    (set, get) => ({
      activeTemplate: null,
      currentStageIndex: 0,
      remainingSeconds: 0,
      isRunning: false,
      lastUpdated: Date.now(),
      
      customizingTemplateId: null,
      setCustomizingTemplateId: (id) => set({ customizingTemplateId: id }),

      startSession: (template) => {
        const firstStage = template.stages[0];
        const totalSeconds = (firstStage.durationMin * 60) + firstStage.durationSec;
        
        playStartSound(); // 🎵 BUNYIKAN SUARA START
        
        set({ 
          activeTemplate: template, 
          currentStageIndex: 0, 
          remainingSeconds: totalSeconds,
          isRunning: true,
          lastUpdated: Date.now(),
          customizingTemplateId: null 
        });
      },

      pauseTimer: () => set({ isRunning: false }),
      resumeTimer: () => set({ isRunning: true, lastUpdated: Date.now() }),

      syncOfflineTime: () => {
        const state = get();
        if (!state.activeTemplate || !state.isRunning) return;
        const now = Date.now();
        const diffInSeconds = Math.floor((now - state.lastUpdated) / 1000);
        const newRemaining = Math.max(0, state.remainingSeconds - diffInSeconds);
        set({ remainingSeconds: newRemaining, lastUpdated: now });
        if (newRemaining === 0) {
          playEndSound(); // 🎵 BUNYIKAN SUARA END (Offline)
          toast.info("Waktu tahap ini sudah habis saat Anda menutup aplikasi!");
        }
      },

      nextStage: () => {
        const state = get();
        if (!state.activeTemplate) return;
        const nextIndex = state.currentStageIndex + 1;
        if (nextIndex < state.activeTemplate.stages.length) {
          const nextStage = state.activeTemplate.stages[nextIndex];
          set({ 
            currentStageIndex: nextIndex, 
            remainingSeconds: (nextStage.durationMin * 60) + nextStage.durationSec,
            isRunning: true,
            lastUpdated: Date.now()
          });
        } else {
          playEndSound(); // 🎵 BUNYIKAN SUARA END (Selesai semua tahap)
          set({ activeTemplate: null, isRunning: false });
        }
      },

tick: () => {
        const state = get();
        if (!state.isRunning || state.remainingSeconds <= 0) return;
        const newRemaining = state.remainingSeconds - 1;
        
        set({ remainingSeconds: newRemaining, lastUpdated: Date.now() });
        
        // Suara Peringatan Sisa 15 Detik
        if (newRemaining === 15) {
          playWarningSound();
          toast.warning("15 detik lagi! Siap-siap angkat.", { duration: 3000 });
        }
        
        // FITUR COUNTDOWN 5 DETIK: Bunyi "Tick" setiap detik di sisa 5, 4, 3, 2, 1
        if (newRemaining <= 5 && newRemaining > 0) {
          playTickSound();
        }
        
        // Waktu Habis (0 Detik)
        if (newRemaining === 0) {
          playEndSound(); // Bunyikan lonceng panjang
          const currentStage = state.activeTemplate?.stages[state.currentStageIndex];
          if (currentStage?.autoNext) {
            get().nextStage();
          } else {
            set({ isRunning: false });
          }
        }
      }
    }),
    {
      name: 'rumah-flow-cooking-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTemplate: state.activeTemplate,
        currentStageIndex: state.currentStageIndex,
        remainingSeconds: state.remainingSeconds,
        isRunning: state.isRunning,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);