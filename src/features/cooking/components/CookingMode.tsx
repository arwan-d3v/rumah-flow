'use client';

import { useCookingStore } from '@/store/useCookingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  X, Pause, Play, ChevronRight, 
  MessageSquare, Volume2, Timer,
  CheckCircle2
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function CookingMode() {
  const { 
    activeTemplate, currentStageIndex, remainingSeconds, 
    isRunning, tick, pauseTimer, resumeTimer, nextStage 
  } = useCookingStore();

  // Engine Timer: Berjalan setiap 1 detik
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, tick]);

  if (!activeTemplate) return null;

  const currentStage = activeTemplate.stages[currentStageIndex];
  const totalStageSeconds = (currentStage.durationMin * 60) + currentStage.durationSec;
  const progress = totalStageSeconds > 0 ? (remainingSeconds / totalStageSeconds) * 100 : 0;

  // Format mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-sand-50 flex flex-col items-center p-8 text-center overflow-hidden"
    >
      {/* 1. Header Area */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-bold text-sand-400 uppercase tracking-[0.3em] mb-1">
            Resep Aktif
          </span>
          <h4 className="text-lg font-semibold text-sand-900">{activeTemplate.name}</h4>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white/50 hover:bg-rose-100 hover:text-rose-600 shadow-sm transition-all" 
          onClick={() => {
            if(confirm("Yakin ingin menghentikan sesi memasak ini?")) {
               useCookingStore.setState({ activeTemplate: null, isRunning: false });
            }
          }}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* 2. Circular Timer Visual */}
      <div className="relative flex items-center justify-center mb-8 group">
        <svg className="w-64 h-64 md:w-80 md:h-80 transform -rotate-90">
          {/* Track */}
          <circle cx="50%" cy="50%" r="45%" stroke="currentColor" className="text-white" strokeWidth="8" fill="transparent" />
          
          {/* Progress Path */}
          <motion.circle 
            cx="50%" cy="50%" r="45%" 
            stroke="currentColor" 
            strokeWidth="10" 
            fill="transparent"
            className="text-sage-500"
            strokeDasharray="283"
            animate={{ strokeDashoffset: (1 - progress / 100) * 283 }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            key={remainingSeconds}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground font-mono"
          >
            {formatTime(remainingSeconds)}
          </motion.span>
          
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white/40 rounded-full backdrop-blur-sm border border-white/20">
            <Timer className="w-3.5 h-3.5 text-sand-500" />
            <span className="text-xs font-bold text-sand-600 uppercase tracking-wider">
              Sisa Waktu
            </span>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Instructions Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStageIndex}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          className="max-w-xl w-full flex-1 flex flex-col justify-center"
        >
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 px-4 py-1.5 rounded-full w-fit mx-auto mb-4 border border-sage-200">
             <span className="text-[10px] font-black uppercase tracking-widest">
               Langkah {currentStageIndex + 1} dari {activeTemplate.stages.length}
             </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
            {currentStage.name}
          </h2>

          <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl shadow-sand-900/10 border border-white relative">
            {currentStage.autoNext && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <CheckCircle2 className="w-3 h-3" /> AUTO-NEXT ACTIVE
              </div>
            )}
            <p className="text-xl md:text-2xl text-sand-800 leading-relaxed font-medium italic">
              "{currentStage.instruction}"
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 4. Controls Footer */}
      <div className="mt-8 w-full max-w-md flex items-center justify-between gap-4 pb-12">
        <Button 
          variant="outline" 
          className="w-14 h-14 rounded-2xl border-none bg-white shadow-sm hover:bg-sand-100 transition-all"
          onClick={() => toast.info("Catatan disimpan untuk sesi ini.")}
        >
          <MessageSquare className="w-6 h-6 text-sand-400" />
        </Button>

        <div className="flex items-center gap-6">
          <Button 
            className={`w-20 h-20 rounded-3xl shadow-2xl transition-all flex items-center justify-center ${
              isRunning 
              ? 'bg-white text-sand-600 hover:bg-sand-100' 
              : 'bg-sage-500 text-white hover:bg-sage-600 shadow-sage-900/20'
            }`}
            onClick={isRunning ? pauseTimer : resumeTimer}
          >
            {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </Button>

          <Button 
            variant="ghost"
            className="w-14 h-14 rounded-2xl bg-white shadow-sm hover:bg-sage-50 group"
            onClick={nextStage}
          >
            <ChevronRight className="w-8 h-8 text-sand-400 group-hover:text-sage-500 transition-colors" />
          </Button>
        </div>

        <div className="w-14 h-14" /> {/* Spacer untuk keseimbangan visual */}
      </div>

      {/* 5. Progress Indicator Dots */}
      <div className="flex gap-2.5">
        {activeTemplate.stages.map((_, idx) => (
          <motion.div 
            key={idx} 
            initial={false}
            animate={{ 
              width: idx === currentStageIndex ? 32 : 8,
              backgroundColor: idx === currentStageIndex ? '#8ba888' : '#dcd7ca'
            }}
            className="h-2 rounded-full transition-all duration-500" 
          />
        ))}
      </div>
    </motion.div>
  );
}