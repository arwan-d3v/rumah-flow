'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCookingStore } from '@/store/useCookingStore';
import { useCookingResume } from '@/hooks/useCookingResume';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { HorizontalDatePicker } from '@/components/shared/HorizontalDatePicker';
import { LogOut, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation'; // Tambahkan untuk redirect

// Core Features Components
import CookingMode from '@/features/cooking/components/CookingMode';
import { RecipeCustomizerDialog } from '@/features/cooking/components/RecipeCustomizerDialog';

// DnD Kit Imports (Ganti Pointer dengan Mouse & Touch)
import { 
  DndContext, 
  DragEndEvent, 
  useSensor, 
  useSensors, 
  MouseSensor, 
  TouchSensor, 
  closestCorners 
} from '@dnd-kit/core';
import { TaskSection } from '@/features/tasks/components/TaskSection';

const SECTIONS = [
  { id: 'morning', title: 'Morning Routine', color: 'bg-orange-50' },
  { id: 'meals', title: 'Meals & Cooking', color: 'bg-rose-50' },
  { id: 'chores', title: 'House Chores', color: 'bg-blue-50' },
  { id: 'family', title: 'Kids & Family', color: 'bg-yellow-50' },
  { id: 'self-care', title: 'Self-care', color: 'bg-sage-50' },
  { id: 'errands', title: 'Errands', color: 'bg-sand-50' },
];

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore();
  const { tasks, moveTask } = useTaskStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const router = useRouter();

  const customizingTemplateId = useCookingStore((state) => state.customizingTemplateId);
  const setCustomizingTemplateId = useCookingStore((state) => state.setCustomizingTemplateId);

  useCookingResume();

  // ROUTE GUARD: Jika user kedapatan logout atau tidak punya sesi, paksa pindah ke halaman login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // KONFIGURASI SENSOR AMAN: Memisahkan interaksi Desktop (Mouse) dan HP Emulator (Touch)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 }, // Geser 5px baru dianggap menyeret
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 }, // Tahan 200ms baru dianggap menyeret, ketukan instan tetap dibaca sebagai klik biasa
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;

    const targetSection = overData?.type === 'Section' ? overId : overData?.task?.section;

    if (targetSection) {
      moveTask(activeId, targetSection as any);
    }
  };

  // Jangan render konten apa pun selama mengecek status otentikasi user
  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-sand-50 pb-20">
      <CookingMode />
      
      {customizingTemplateId && (
        <RecipeCustomizerDialog
          templateId={customizingTemplateId}
          isOpen={!!customizingTemplateId}
          onClose={() => setCustomizingTemplateId(null)}
        />
      )}

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
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sand-500 hover:text-rose-500 rounded-full cursor-pointer">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <HorizontalDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />
        </div>
      </header>

      <main className="px-6 max-w-5xl mx-auto space-y-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" />
            <Input 
              placeholder="Fokus utama hari ini..." 
              className="w-full pl-12 h-14 rounded-2xl border-none shadow-sm shadow-sand-900/5 bg-white text-base focus-visible:ring-sage-500"
            />
          </div>
          <Button className="h-14 w-14 rounded-2xl bg-sage-500 hover:bg-sage-900 shadow-md shadow-sage-900/20 text-white shrink-0">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {SECTIONS.map((section) => {
              const sectionTasks = tasks.filter(t => t.section === section.id);
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