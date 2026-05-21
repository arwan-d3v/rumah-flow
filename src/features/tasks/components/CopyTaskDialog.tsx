'use client';

import { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/schema';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { Check, Copy, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface CopyTaskDialogProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopyTaskDialog({ task, isOpen, onOpenChange }: CopyTaskDialogProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);

  const calendarDays = useMemo(() => {
    return Array.from({ length: 21 }).map((_, index) => {
      const date = addDays(new Date(), index);
      return {
        date,
        dateKey: date.toISOString().split('T')[0],
      };
    });
  }, []);

  const toggleDate = (dateKey: string) => {
    setSelectedDates((current) =>
      current.includes(dateKey)
        ? current.filter((item) => item !== dateKey)
        : [...current, dateKey]
    );
  };

  const handleApply = async () => {
    if (!task || selectedDates.length === 0) {
      toast.error('Pilih setidaknya satu tanggal terlebih dahulu.');
      return;
    }

    if (!user) {
      toast.error('Akun tidak terdeteksi. Silakan login ulang.');
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.all(
        selectedDates.map(async (targetDate) => {
          const order = tasks.filter(
            (item) => item.targetDate === targetDate && item.section === task.section
          ).length;

          const duplicateTask: Task = {
            ...task,
            id: `task_copy_${targetDate}_${Date.now()}`,
            userId: user.uid,
            targetDate,
            status: 'todo',
            order,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          await addTask(duplicateTask);
        })
      );

      toast.success(`Task berhasil disalin ke ${selectedDates.length} tanggal.`);
      setSelectedDates([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Gagal menyalin task:', error);
      toast.error('Gagal menyalin task. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white rounded-[2rem] p-6 border-none shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl font-bold text-sand-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-sage-600" /> Salin Tugas
          </DialogTitle>
          <DialogDescription className="text-sand-500">
            Pilih beberapa tanggal untuk menduplikasi tugas ini tanpa mengubah tugas asli.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-sand-200 bg-sand-50 p-4 mb-5">
          <p className="text-sm font-semibold text-sand-700">Tugas yang disalin</p>
          <p className="text-sm text-sand-500 mt-1">{task.title}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-sand-600 shadow-sm">
            <Copy className="h-4 w-4" />
            {task.section} · {task.cookingTemplateId ? 'Mode Masak' : 'Task biasa'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-3">
          {calendarDays.map(({ date, dateKey }) => {
            const isSelected = selectedDates.includes(dateKey);
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => toggleDate(dateKey)}
                className={`rounded-3xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-sage-600 bg-sage-50 text-sage-800 shadow-sm'
                    : 'border-sand-200 bg-white text-sand-700 hover:border-sage-200 hover:bg-sand-50'
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-sand-400">{format(date, 'EEEE', { locale: id })}</p>
                <p className="mt-1 text-lg font-bold">{format(date, 'd')}</p>
                <p className="text-[10px] text-sand-400">{format(date, 'MMM')}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-sand-500">
            {selectedDates.length ? `${selectedDates.length} tanggal dipilih` : 'Belum ada tanggal dipilih'}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={selectedDates.length === 0 || isSubmitting}
              className="bg-sage-600 text-white hover:bg-sage-700"
            >
              {isSubmitting ? 'Menyimpan...' : 'Salin ke tanggal terpilih'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
