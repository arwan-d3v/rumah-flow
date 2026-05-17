// src/lib/audio.ts

// Singleton AudioContext agar browser tidak memblokir suara
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// 1. SUARA MULAI: Nada naik (Optimis)
export const playStartSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};

// 2. SUARA PERINGATAN (15 Detik Terakhir): Beep-beep pendek ganda
export const playWarningSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playBeep = (startTime: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.15);
    
    osc.start(startTime);
    osc.stop(startTime + 0.15);
  };

  playBeep(ctx.currentTime);
  playBeep(ctx.currentTime + 0.2);
};

// 3. SUARA COUNTDOWN (5 Detik Terakhir): Detak tajam (Tick)
export const playTickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'triangle'; // Suara ketukan padat
  osc.frequency.setValueAtTime(1000, ctx.currentTime); // Nada tinggi/nyaring
  // Frekuensi turun drastis agar terdengar seperti "tak!" (perkusi)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05); 
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); // Durasi sangat pendek (0.1 detik)
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

// 4. SUARA SELESAI: Lonceng panjang (Melegakan)
export const playEndSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Nada C5
  
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2.0);
};