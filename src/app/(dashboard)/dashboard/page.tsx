'use client';

// ============================================================================
// 1. LIBRARY & MODULE IMPORTS
// ============================================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LogOut, Plus, Search } from 'lucide-react';

// Firebase & Auth
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

// Zustand Global Stores
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCookingStore } from '@/store/useCookingStore';
import { useHolidayStore } from '@/store/useHolidayStore';
import { useCookingResume } from '@/hooks/useCookingResume';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HorizontalDatePicker } from '@/components/shared/HorizontalDatePicker';
import CookingMode from '@/features/cooking/components/CookingMode';
import { RecipeCustomizerDialog } from '@/features/cooking/components/RecipeCustomizerDialog';
import { TaskSection } from '@/features/tasks/components/TaskSection';
import { QuickAddTaskDialog } from '@/features/tasks/components/QuickAddTaskDialog';

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

// ============================================================================
// 3. MAIN DASHBOARD COMPONENT
// ============================================================================
export default function DashboardPage() {
  const router = useRouter();

  // --- A. LOCAL STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false); // State untuk Pop-up Tambah Tugas

  // --- B. GLOBAL STORE SUBSCRIPTIONS ---
  const { user, isLoading } = useAuthStore();
  const { tasks, moveTask, subscribeToTasks } = useTaskStore(); 
  const customizingTemplateId = useCookingStore((state) => state.customizingTemplateId);
  const setCustomizingTemplateId = useCookingStore((state) => state.setCustomizingTemplateId);
  const fetchHolidays = useHolidayStore(state => state.fetchHolidays);

  // --- C. DERIVED STATE (LOGIC FILTER WAKTU & LIBUR) ---
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  // LOGIKA MESIN WAKTU: Menarik tugas hari ini + Tugas Harian dari masa lalu
  const filteredTasksForToday = tasks.filter(task => {
    // 1. Munculkan jika tugas memang dibuat khusus untuk tanggal ini
    if (task.targetDate === selectedDateStr) return true;
    
    // 2. Munculkan jika tugas adalah "Rutinitas Harian" DAN dibuat pada atau sebelum tanggal ini
    if (task.recurrence === 'daily' && task.targetDate <= selectedDateStr) return true;
    
    return false;
  });

  const holidayToday = useHolidayStore(state => state.getHolidayByDate)(selectedDateStr);

  // --- D. HOOKS & LIFECYCLE EFFECTS ---
  useCookingResume(); // Menjalankan timer offline jika ada sesi masak yang terputus

  // Effect 1: Hydration Penyelamat & Load Data Libur
  useEffect(() => {
    setIsMounted(true);
    fetchHolidays(2026); // Ambil database libur nasional tahun 2026
  }, [fetchHolidays]);

  // Effect 2: Route Guard & Database Subscription
  useEffect(() => {
    if (isMounted && !isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        // Mulai sinkronisasi realtime dengan Firestore saat user valid
        const unsubscribe = subscribeToTasks(user.uid);
        
        // Bersihkan listener saat komponen dibongkar
        return () => unsubscribe();
      }
    }
  }, [user, isLoading, router, isMounted, subscribeToTasks]);

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
      moveTask(activeId, targetSection as any);
    }
  };

  // ============================================================================
  // 4. RENDER UI
  // ============================================================================

  // --- KONDISI LOADING ---
  if (!isMounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-sage-600 font-semibold animate-pulse flex items-center gap-2">
          <span>Menyiapkan Dapur Rumah Flow...</span>
        </div>
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
            {SECTIONS.map((section) => {
              const sectionTasks = filteredTasksForToday.filter(t => t.section === section.id);
              
              return (
                <TaskSection 
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  colorClass={section.color}
                  tasks={sectionTasks}
                />
              );
            })}
          </div>
        </DndContext>

      </main>
    </div>
  );
}