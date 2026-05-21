'use client';

// ============================================================================
// 1. LIBRARY & MODULE IMPORTS
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, HeartHandshake, LogOut, ShieldCheck, Sparkles, ChefHat, ShoppingCart, CalendarDays } from 'lucide-react';

// Firebase & Auth
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

// Zustand Global Stores
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCookingStore } from '@/store/useCookingStore';
import { useHolidayStore } from '@/store/useHolidayStore';
import { useUiStore } from '@/store/useUiStore';
import { useCookingResume } from '@/hooks/useCookingResume';

// UI Components
import { Button } from '@/components/ui/button';
import { HorizontalDatePicker } from '@/components/shared/HorizontalDatePicker';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import CookingMode from '@/features/cooking/components/CookingMode';
import { RecipeCustomizerDialog } from '@/features/cooking/components/RecipeCustomizerDialog';
import { TaskSection } from '@/features/tasks/components/TaskSection';
import { Task, SectionType } from '@/types/schema';

// DnD Kit (Drag & Drop)
import { 
  DndContext, DragEndEvent, useSensor, useSensors, 
  MouseSensor, TouchSensor, closestCorners 
} from '@dnd-kit/core';

// ============================================================================
// 2. STATIC CONFIGURATIONS
// ============================================================================
const SECTIONS = [
  { id: 'morning', title: 'Morning Routine', color: 'bg-orange-50 dark:bg-orange-950/30' },
  { id: 'meals', title: 'Meals & Cooking', color: 'bg-rose-50 dark:bg-rose-950/30' },
  { id: 'chores', title: 'House Chores', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'family', title: 'Kids & Family', color: 'bg-yellow-50 dark:bg-yellow-950/30' },
  { id: 'self-care', title: 'Self-care', color: 'bg-sage-50 dark:bg-sage-950/30' },
  { id: 'errands', title: 'Errands', color: 'bg-sand-50 dark:bg-sand-950/30' },
];

const VIEW_MODES = [
  { id: 'masak', label: 'Masak' },
  { id: 'daily', label: 'Daily Plan' },
  { id: 'belanja', label: 'Belanja' },
] as const;

// ============================================================================
// 3. INLINE ADD FORM (Local component for Masak & Belanja modes)
// ============================================================================
function InlineAddForm({ placeholder, onSubmit }: { placeholder: string; onSubmit: (title: string) => void }) {
  const [value, setValue] = useState('');
  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-border bg-card p-1.5 sm:p-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground px-2 sm:px-3 py-2.5"
      />
      <Button size="sm" onClick={handleSubmit} disabled={!value.trim()} className="rounded-xl px-4 sm:px-5 font-semibold shrink-0">
        Tambah
      </Button>
    </div>
  );
}

// ============================================================================
// 4. MAIN DASHBOARD COMPONENT
// ============================================================================
export default function DashboardPage() {

  // --- A. LOCAL STATE ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // --- B. GLOBAL STORE SUBSCRIPTIONS ---
  const { user, isLoading } = useAuthStore();
  const { tasks, addTask, moveTask, subscribeToTasks } = useTaskStore(); 
  const customizingTemplateId = useCookingStore((state) => state.customizingTemplateId);
  const setCustomizingTemplateId = useCookingStore((state) => state.setCustomizingTemplateId);
  const fetchHolidays = useHolidayStore(state => state.fetchHolidays);
  const displayMode = useUiStore((state) => state.displayMode);
  const setDisplayMode = useUiStore((state) => state.setDisplayMode);

  // --- C. DERIVED STATE (LOGIC FILTER WAKTU & LIBUR) ---
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const filteredTasksForToday = useMemo(() => {
    const taskMatchesMode = (task: Task) => {
      if (displayMode === 'masak') {
        return task.section === 'meals' || !!task.cookingTemplateId;
      }

      if (displayMode === 'belanja') {
        return task.section === 'errands' || task.title.toLowerCase().includes('belanja');
      }

      return task.section !== 'meals';
    };

    return tasks.filter((task) => {
      if (task.targetDate === selectedDateStr && taskMatchesMode(task)) return true;
      if (task.recurrence === 'daily' && task.targetDate <= selectedDateStr && taskMatchesMode(task)) return true;
      return false;
    });
  }, [tasks, selectedDateStr, displayMode]);

  const holidayToday = useHolidayStore(state => state.getHolidayByDate)(selectedDateStr);

  const visibleSections = useMemo(
    () => SECTIONS.filter((section) => filteredTasksForToday.some((task) => task.section === section.id)),
    [filteredTasksForToday]
  );

  // --- D. HOOKS & LIFECYCLE EFFECTS ---
  useCookingResume(); // Menjalankan timer offline jika ada sesi masak yang terputus

  // Effect 1: Hydration Penyelamat & Load Data Libur
  useEffect(() => {
    fetchHolidays(2026); // Ambil database libur nasional tahun 2026
  }, [fetchHolidays]);

  // Effect 2: Database Subscription for authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      const unsubscribe = subscribeToTasks(user.uid);
      return () => unsubscribe();
    }
  }, [user, isLoading, subscribeToTasks]);

  // --- E. DND-KIT SENSOR CONFIGURATION ---
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // --- F. EVENT HANDLERS ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout gagal:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;
    
    // Cari tahu target kotak atau item lain yang ditimpa
    const targetSection = overData?.type === 'Section' ? overId : overData?.task?.section;

    if (targetSection) {
      moveTask(activeId, targetSection as SectionType);
    }
  };

  // ─── HANDLER: Inline Add Task (Contextual) ───
  const handleInlineAddTask = async (title: string, section: SectionType) => {
    if (!user) return;
    const now = Date.now();
    const task: Task = {
      id: `task_${now}_${Math.random().toString(36).slice(2, 9)}`,
      userId: user.uid,
      title,
      status: 'todo',
      section,
      targetDate: selectedDateStr,
      recurrence: 'none',
      order: 0,
      createdAt: now,
      updatedAt: now,
    };
    await addTask(task);
  };

  // ─── CONTEXTUAL INLINE INPUTS ───
  const renderContextualAddInput = () => {
    if (displayMode === 'belanja') {
      return (
        <InlineAddForm
          placeholder="Tambah barang belanjaan..."
          onSubmit={(title) => handleInlineAddTask(title, 'errands')}
        />
      );
    }
    if (displayMode === 'masak') {
      return (
        <InlineAddForm
          placeholder="Tambah resep atau rencana masakan..."
          onSubmit={(title) => handleInlineAddTask(title, 'meals')}
        />
      );
    }
    // Daily Plan — no global input needed; done per-section via ghost buttons
    return null;
  };

  // ============================================================================
  // 5. RENDER UI
  // ============================================================================

  // --- KONDISI LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-semibold animate-pulse flex items-center gap-2">
          <span>Menyiapkan Dapur Rumah Flow...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* ── HERO SECTION — Elegant Gradient ── */}
        <header className="relative overflow-hidden bg-gradient-to-br from-sage-800 via-sage-700 to-sage-600 dark:from-sage-950 dark:via-sage-900 dark:to-sage-800 text-white pt-2 sm:pt-0">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-400/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-lavender-400/20 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16 sm:pb-20 md:pt-12 md:pb-28">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-10 sm:mb-16">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Rumah Flow</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Hero Content */}
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="space-y-5 sm:space-y-8">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">
                    <Sparkles className="w-3.5 h-3.5" />
                    Aplikasi Ibu Rumah Tangga
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  Atur Rumah,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-rose-200 to-lavender-200">
                    Tetap Tenang & Elegan
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-sage-100/90 max-w-lg leading-relaxed">
                  Satu aplikasi untuk semua kebutuhan Bunda: rencanakan masakan, atur tugas harian, kelola daftar belanja, dan rawat diri sendiri — semua dalam genggaman.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-2xl bg-white text-sage-800 hover:bg-sage-50 font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base shadow-2xl shadow-white/20 hover:shadow-white/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Link href="/login">
                      Mulai Sekarang — Gratis
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base backdrop-blur-sm transition-all hover:border-white/50"
                  >
                    <Link href="/login">Lihat Fitur Lengkap</Link>
                  </Button>
                </div>
              </div>

              {/* Hero Visual — Abstract Elegant Cards */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { icon: <ChefHat className="w-6 h-6" />, label: 'Mode Masak', gradient: 'from-rose-500/30 to-rose-600/20', delay: 0 },
                  { icon: <CalendarDays className="w-6 h-6" />, label: 'Daily Plan', gradient: 'from-sage-400/30 to-sage-500/20', delay: 0.1 },
                  { icon: <ShoppingCart className="w-6 h-6" />, label: 'Belanja', gradient: 'from-lavender-500/30 to-lavender-600/20', delay: 0.2 },
                  { icon: <HeartHandshake className="w-6 h-6" />, label: 'Self-Care', gradient: 'from-rose-300/30 to-rose-400/20', delay: 0.3 },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay, duration: 0.5 }}
                    className={`rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/10 backdrop-blur-xl p-6 aspect-square flex flex-col items-center justify-center gap-3 shadow-lg shadow-white/5`}
                  >
                    <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-sm font-semibold text-white/90">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── FEATURES SECTION — Glassmorphism Cards ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Mode Masak',
                description: 'Timer cerdas, resep simpel, dan jadwal masak yang bikin dapur selalu hangat tanpa drama.',
                icon: <ChefHat className="w-6 h-6" />,
                accent: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/30',
                iconBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
              },
              {
                title: 'Daily Plan',
                description: 'Prioritaskan tugas, self-care, dan waktu keluarga dalam satu tampilan yang tenang.',
                icon: <CalendarDays className="w-6 h-6" />,
                accent: 'bg-sage-50 dark:bg-sage-950/40 border-sage-200 dark:border-sage-800/30',
                iconBg: 'bg-sage-100 dark:bg-sage-900/50 text-sage-600 dark:text-sage-400',
              },
              {
                title: 'Belanja Pintar',
                description: 'Daftar belanja otomatis dari resep & kebutuhan rumah. Anti lupa, anti boros.',
                icon: <ShoppingCart className="w-6 h-6" />,
                accent: 'bg-lavender-50 dark:bg-lavender-950/40 border-lavender-200 dark:border-lavender-800/30',
                iconBg: 'bg-lavender-100 dark:bg-lavender-900/50 text-lavender-600 dark:text-lavender-400',
              },
              {
                title: 'Notifikasi & PWA',
                description: 'Pasang di homescreen, dapatkan reminder jadwal masak dan tugas penting tepat waktu.',
                icon: <ShieldCheck className="w-6 h-6" />,
                accent: 'bg-sand-50 dark:bg-sand-950/40 border-sand-200 dark:border-sand-800/30',
                iconBg: 'bg-sand-100 dark:bg-sand-900/50 text-sand-600 dark:text-sand-400',
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`rounded-[1.75rem] border ${feature.accent} bg-card/80 backdrop-blur-xl p-6 shadow-lg shadow-black/5 dark:shadow-white/5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg} mb-5`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── BENEFITS & DETAILS ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-12">
          {/* Benefit Cards */}
          <div className="rounded-[1.75rem] sm:rounded-[2.5rem] bg-card border border-border p-5 sm:p-8 md:p-10 shadow-sm">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="uppercase tracking-[0.3em] text-primary text-xs font-bold mb-4">Benefit untuk Bunda</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Dukungan nyata untuk kesehatan mental & tugas rumah
                </h2>
                <p className="mt-5 text-muted-foreground leading-7 text-base">
                  Rumah Flow dirancang agar Bunda bisa merasa lebih ringan saat mengelola keluarga, masak, belanja, dan waktu istirahat. Semua fitur dibuat untuk mencegah overwhelm dan membantu rutinitas tetap lembut.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 w-full lg:w-auto">
                {[
                  { title: 'Rencana Harian Khusus', desc: 'Dirancang untuk ritme ibu rumah tangga' },
                  { title: 'Timer & Resep Masak', desc: 'Masak tanpa panik dengan panduan built-in' },
                  { title: 'Self-Care & Keluarga', desc: 'Seimbangkan tugas dan waktu istirahat' },
                  { title: 'PWA & Offline Siap', desc: 'Pasang di homescreen, akses kapan saja' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl bg-secondary/50 border border-border p-5 hover:bg-secondary transition-colors"
                  >
                    <p className="text-sm font-bold text-foreground mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features + Preview Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Fitur Inti */}
          <div className="rounded-[1.75rem] sm:rounded-[2.5rem] bg-gradient-to-br from-sage-800 to-sage-700 dark:from-sage-900 dark:to-sage-800 p-6 sm:p-8 md:p-10 text-white shadow-xl shadow-sage-900/20">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Fitur Inti Rumah Flow</h3>
            <ul className="space-y-4 sm:space-y-5">
                {[
                  'Susun tugas rumah, masak, & self-care dalam satu layar',
                  'Mode khusus: Masak, Daily Plan, dan Belanja',
                  'Drag & drop tugas antar kategori dengan mudah',
                  'Duplikasi tugas ke banyak tanggal sekaligus',
                  'Kompatibel PWA — pasang ke homescreen',
                ].map((item) => (
                  <li key={item} className="flex gap-3 sm:gap-4 items-start">
                    <span className="mt-0.5 flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <span className="text-sage-50/90 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preview */}
            <div className="rounded-[1.75rem] sm:rounded-[2.5rem] bg-card border border-border p-6 sm:p-8 md:p-10 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Seperti Apa Tampilannya?</h3>
              <p className="text-muted-foreground leading-7 mb-4 sm:mb-6 text-sm sm:text-base">
                Dashboard ringkas dengan kalender harian horizontal, mode tampilan yang bisa diganti sesuai aktivitas, dan area tugas yang mudah di-drag & drop. Cocok untuk Bunda yang butuh satu tempat memantau semua jadwal rumah tangga.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Kalender harian horizontal', icon: '📅' },
                  { label: 'Mode Masak dengan timer fokus', icon: '⏲️' },
                  { label: 'Drag & drop tugas antar kategori', icon: '↔️' },
                  { label: 'Tugas berulang & tanggal penting', icon: '🔁' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/40 hover:bg-secondary transition-colors">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA — High Conversion ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="rounded-[1.75rem] sm:rounded-[2.5rem] bg-gradient-to-br from-primary via-rose-600 to-rose-700 dark:from-primary dark:via-rose-700 dark:to-rose-800 p-6 sm:p-10 md:p-14 text-white shadow-2xl shadow-primary/30 dark:shadow-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm uppercase tracking-[0.3em] font-bold text-white/70 mb-3">Siap Memulai?</p>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Ringankan beban harian Bunda dengan Rumah Flow.
                </h2>
                <p className="mt-4 text-white/80 leading-relaxed">
                  Gratis, tanpa ribet. Cukup login dan semua fitur siap menemani rutinitas Bunda.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="inline-flex items-center gap-3 rounded-2xl bg-white text-primary hover:bg-rose-50 font-bold px-10 py-7 text-lg shadow-2xl shadow-black/20 hover:shadow-black/30 transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                <Link href="/login">
                  Masuk Sekarang — Gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // --- RENDER UTAMA (AUTHENTICATED) ---
  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* SECTION: GLOBAL OVERLAYS (Dialog & Fullscreen Modes) */}
      <CookingMode />
      
      <RecipeCustomizerDialog
        templateId={customizingTemplateId || ''}
        isOpen={!!customizingTemplateId}
        onClose={() => setCustomizingTemplateId(null)}
      />

      {/* SECTION: HEADER (Greeting & Kalender Horizontal) */}
      <header className="bg-card border-b border-border px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6 rounded-b-[2rem] sm:rounded-b-[2.5rem] shadow-sm mb-4 sm:mb-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Halo, {user?.displayName ? user.displayName.split(' ')[0] : 'Bunda'}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="text-muted-foreground hover:text-destructive rounded-full cursor-pointer relative z-50 pointer-events-auto"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <HorizontalDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-between sm:items-center">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Mode tampilan
            </p>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDisplayMode(mode.id)}
                  className={`min-w-[5rem] sm:min-w-[6rem] rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    displayMode === mode.id
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* SECTION: MAIN CONTENT BODY */}
      <main className="px-4 sm:px-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
        
        {/* SMART SUGGESTION BANNER (Hanya jika Libur Nasional) */}
        {holidayToday && (
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/50 dark:to-orange-950/50 border border-rose-100 dark:border-rose-800/30 p-5 rounded-[2rem] shadow-sm flex items-center gap-5 transform transition-all animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="bg-card w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">
              🎉
            </div>
            <div className="flex-1">
              <h3 className="text-rose-800 dark:text-rose-300 font-bold text-sm tracking-wide uppercase mb-0.5">
                Libur Nasional: {holidayToday.name}
              </h3>
              <p className="text-rose-600 dark:text-rose-400 text-sm font-medium leading-relaxed">
                Sistem menyarankan untuk mendelegasikan rutinitas berat. Waktunya bersantai dan mengisi ulang energi bersama keluarga!
              </p>
            </div>
          </div>
        )}

        {/* CONTEXTUAL INLINE ADD INPUT (Masak / Belanja modes) */}
        {renderContextualAddInput()}

        {/* DRAG & DROP GRID */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-2">
            <AnimatePresence mode="popLayout">
              {visibleSections.map((section) => {
                const sectionTasks = filteredTasksForToday.filter((t) => t.section === section.id);

                return (
                  <motion.div
                    key={section.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <TaskSection
                      id={section.id}
                      title={section.title}
                      colorClass={section.color}
                      tasks={sectionTasks}
                      showInlineAdd={displayMode === 'daily'}
                      onAddTask={handleInlineAddTask}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {visibleSections.length === 0 && (
              <div className="col-span-full rounded-[1.5rem] sm:rounded-[2rem] border border-border bg-card/80 p-5 sm:p-8 text-center shadow-sm">
                <p className="text-foreground text-base sm:text-lg font-semibold mb-1 sm:mb-2">Belum ada tugas untuk mode ini</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Silakan pilih tanggal lain atau tambahkan tugas baru untuk melihat daftar di sini.</p>
              </div>
            )}
          </div>
        </DndContext>

      </main>
    </div>
  );
}