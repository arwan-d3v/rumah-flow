'use client';

// ============================================================================
// 1. LIBRARY & MODULE IMPORTS
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, HeartHandshake, LogOut, Plus, Search, ShieldCheck, Sparkles } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { HorizontalDatePicker } from '@/components/shared/HorizontalDatePicker';
import CookingMode from '@/features/cooking/components/CookingMode';
import { RecipeCustomizerDialog } from '@/features/cooking/components/RecipeCustomizerDialog';
import { TaskSection } from '@/features/tasks/components/TaskSection';
import { QuickAddTaskDialog } from '@/features/tasks/components/QuickAddTaskDialog';
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
  { id: 'morning', title: 'Morning Routine', color: 'bg-orange-50' },
  { id: 'meals', title: 'Meals & Cooking', color: 'bg-rose-50' },
  { id: 'chores', title: 'House Chores', color: 'bg-blue-50' },
  { id: 'family', title: 'Kids & Family', color: 'bg-yellow-50' },
  { id: 'self-care', title: 'Self-care', color: 'bg-sage-50' },
  { id: 'errands', title: 'Errands', color: 'bg-sand-50' },
];

const VIEW_MODES = [
  { id: 'masak', label: 'Masak' },
  { id: 'daily', label: 'Daily Plan' },
  { id: 'belanja', label: 'Belanja' },
] as const;

// ============================================================================
// 3. MAIN DASHBOARD COMPONENT
// ============================================================================
export default function DashboardPage() {
  const router = useRouter();

  // --- A. LOCAL STATE ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false); // State untuk Pop-up Tambah Tugas

  // --- B. GLOBAL STORE SUBSCRIPTIONS ---
  const { user, isLoading } = useAuthStore();
  const { tasks, moveTask, subscribeToTasks } = useTaskStore(); 
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

  // ============================================================================
  // 4. RENDER UI
  // ============================================================================

  // --- KONDISI LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-sage-600 font-semibold animate-pulse flex items-center gap-2">
          <span>Menyiapkan Dapur Rumah Flow...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sand-50 pb-20">
        <header className="bg-gradient-to-r from-sage-800 via-sage-700 to-sage-600 text-white px-6 py-16 md:py-24">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-sage-200 mb-4">Rumah Flow</p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Bantu Bunda atur tugas harian, masak, dan self-care dengan lebih tenang.
              </h1>
              <p className="mt-6 text-base md:text-lg text-sage-100 max-w-2xl leading-8">
                Dashboard publik Rumah Flow menampilkan fitur unggulan aplikasi untuk mendukung kesehatan mental dan produktivitas mama di rumah.
                Bunda bisa melihat benefit, mode masak, pengingat tugas, dan cara aplikasi membantu membuat rutinitas harian lebih ringan.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild className="rounded-2xl bg-white text-sage-900 hover:bg-sage-100 px-6 py-3 shadow-lg shadow-sage-900/10">
                  <Link href="/login">Masuk untuk mulai sekarang</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-white/70 text-white hover:bg-white/10 px-6 py-3">
                  <Link href="/login">Coba fitur preview</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Mode Masak',
                  description: 'Atur jadwal masak, timer, dan resep sederhana agar rumah tetap hangat tanpa ribet.',
                  icon: <Sparkles className="w-5 h-5" />,
                },
                {
                  title: 'Daily Plan',
                  description: 'Prioritaskan tugas rumah dan self-care agar harimu tetap seimbang dan tenang.',
                  icon: <HeartHandshake className="w-5 h-5" />,
                },
                {
                  title: 'Belanja Pintar',
                  description: 'Kelompokkan kebutuhan rumah dan masak jadi daftar belanja otomatis.',
                  icon: <ShieldCheck className="w-5 h-5" />,
                },
                {
                  title: 'Notifikasi & PWA',
                  description: 'Pasang di homescreen dan dapatkan reminder penting di browsermu.',
                  icon: <ArrowRight className="w-5 h-5" />,
                },
              ].map((feature) => (
                <div key={feature.title} className="rounded-[1.75rem] bg-white/10 border border-white/10 p-6 shadow-lg shadow-slate-950/10 backdrop-blur-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sage-100 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
          <section className="rounded-[2rem] bg-white shadow-sm shadow-sand-900/5 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="uppercase tracking-[0.35em] text-sage-600 text-xs font-semibold mb-3">Benefit untuk Bunda</p>
                <h2 className="text-3xl font-semibold text-slate-900">Dukungan nyata untuk kesehatan mental dan tugas rumah</h2>
                <p className="mt-4 text-sand-600 leading-7">
                  Rumah Flow dirancang supaya mama bisa merasa lebih ringan saat mengelola keluarga, masak, belanja, dan waktu istirahat. Semua fitur dibuat untuk mencegah overwhelm dan membantu rutinitas tetap lembut.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  'Rencana harian khusus ibu rumah tangga',
                  'Pengingat tugas masak dan belanja',
                  'Dukungan self-care & jadwal anak',
                  'Mode masak dengan timer built-in',
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-sage-100 bg-sage-50 p-5">
                    <p className="text-sm text-sage-900 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] bg-sage-900/95 p-8 text-white shadow-lg shadow-sage-900/20">
              <h3 className="text-2xl font-semibold mb-4">Fitur Inti</h3>
              <ul className="space-y-3 text-sage-100">
                <li className="flex gap-3 items-start">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />
                  Buat dan susun tugas rumah, masak, serta self-care dalam satu layar.
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />
                  Mode khusus untuk Masak, Belanja, dan Daily Plan.
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />
                  Dialog cepat untuk menambahkan tugas dan duplikasi ke banyak tanggal.
                </li>
                <li className="flex gap-3 items-start">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />
                  Kompatibel PWA agar aplikasi bisa dipasang ke homescreen.
                </li>
              </ul>
            </div>
            <div className="rounded-[2rem] bg-white border border-sand-200 p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Tampilannya seperti apa?</h3>
              <p className="text-sand-600 leading-7">
                Dashboard menawarkan ringkasan hari ini dengan tanggal, mode tampilan, dan area tugas yang mudah digeser. Cocok untuk momy yang butuh satu tempat memantau semua jadwal rumah tangga.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Kalender harian horizontal',
                  'Mode Masak untuk fokus resep dan timer',
                  'Daftar tugas bisa di-drag & drop antar kategori',
                  'Bisa simpan tugas berulang dan tanggal penting',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-sage-50 text-sage-700">✓</span>
                    <p className="text-sand-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-rose-50 border border-rose-100 p-8 text-rose-900 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] font-semibold">Mulai sekarang</p>
                <h2 className="text-3xl font-semibold">Lihat cara Rumah Flow meringankan beban tugas harian Mama.</h2>
              </div>
              <Button asChild className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-rose-900 shadow-lg shadow-rose-900/10">
                <Link href="/login">
                  Masuk untuk mencoba
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="min-h-screen bg-sand-50 pb-20">
      
      {/* SECTION: GLOBAL OVERLAYS (Dialog & Fullscreen Modes) */}
      <CookingMode />
      
      <RecipeCustomizerDialog
        templateId={customizingTemplateId || ''}
        isOpen={!!customizingTemplateId}
        onClose={() => setCustomizingTemplateId(null)}
      />
      
      {/* Pop-up Brain Dump / Quick Add Task */}
      <QuickAddTaskDialog 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        selectedDateStr={selectedDateStr}
      />

      {/* SECTION: HEADER (Greeting & Kalender Horizontal) */}
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-sm shadow-sand-900/5 mb-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-sm font-medium text-sand-500 mb-1">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
              </p>
              <h1 className="text-3xl font-semibold text-foreground">
                Halo, {user?.displayName ? user.displayName.split(' ')[0] : 'Bunda'}
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="text-sand-500 hover:text-rose-500 rounded-full cursor-pointer relative z-50 pointer-events-auto"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <HorizontalDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

          <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sand-400">
              Mode tampilan
            </p>
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setDisplayMode(mode.id)}
                  className={`min-w-[6rem] rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                    displayMode === mode.id
                      ? 'bg-sage-600 border-sage-600 text-white shadow-sm shadow-sage-600/20'
                      : 'bg-white border-sand-200 text-sand-600 hover:border-sage-200 hover:text-sage-700'
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
      <main className="px-6 max-w-5xl mx-auto space-y-6">
        
        {/* SMART SUGGESTION BANNER (Hanya jika Libur Nasional) */}
        {holidayToday && (
          <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-5 transform transition-all animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0">
              🎉
            </div>
            <div className="flex-1">
              <h3 className="text-rose-800 font-bold text-sm tracking-wide uppercase mb-0.5">
                Libur Nasional: {holidayToday.name}
              </h3>
              <p className="text-rose-600 text-sm font-medium leading-relaxed">
                Sistem menyarankan untuk mendelegasikan rutinitas berat. Waktunya bersantai dan mengisi ulang energi bersama keluarga!
              </p>
            </div>
          </div>
        )}

        {/* SEARCH & QUICK ADD TASK */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
            <Input 
              placeholder="Fokus utama hari ini..." 
              className="w-full pl-12 h-14 rounded-2xl border-none shadow-sm shadow-sand-900/5 bg-white text-base focus-visible:ring-sage-500"
            />
          </div>
          <Button 
            onClick={() => setIsQuickAddOpen(true)} // Memicu Dialog Terbuka
            className="h-14 w-14 rounded-2xl bg-sage-500 hover:bg-sage-900 shadow-md shadow-sage-900/20 text-white shrink-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* DRAG & DROP GRID */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
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
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {visibleSections.length === 0 && (
              <div className="col-span-full rounded-[2rem] border border-sand-200 bg-white/90 p-8 text-center shadow-sm">
                <p className="text-slate-900 text-lg font-semibold mb-2">Belum ada tugas untuk mode ini</p>
                <p className="text-sm text-sand-500">Silakan pilih tanggal lain atau tambahkan tugas baru untuk melihat daftar di sini.</p>
              </div>
            )}
          </div>
        </DndContext>

      </main>
    </div>
  );
}