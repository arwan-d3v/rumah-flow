'use client';

import { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CookingTemplate, Task } from '@/types/schema';
import { GripVertical, Play, Pencil, Check, Clock, MoreVertical, ChefHat, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useCookingStore } from '@/store/useCookingStore';
import { useTaskStore } from '@/store/useTaskStore';
import { DEFAULT_COOKING_TEMPLATES } from '@/lib/constants';
import { CopyTaskDialog } from './CopyTaskDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const setCustomizingTemplateId = useCookingStore((state) => state.setCustomizingTemplateId);
  const startSession = useCookingStore((state) => state.startSession);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isCopyTaskOpen, setIsCopyTaskOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(task.timerDurationMin ?? 30);

  const deleteTask = useTaskStore((state) => state.deleteTask);

  const timerMinutes = useMemo(() => task.timerDurationMin ?? durationMinutes ?? 30, [task.timerDurationMin, durationMinutes]);

  const cookingTemplate = useMemo(
    () => {
      if (!task.cookingTemplateId) return null;
      return DEFAULT_COOKING_TEMPLATES.find((template) => template.id === task.cookingTemplateId) || null;
    },
    [task.cookingTemplateId]
  );

  const effectiveTemplate = useMemo(() => {
    if (cookingTemplate) return cookingTemplate;

    return {
      id: `timer_${task.id}`,
      name: task.title,
      totalDurationMin: timerMinutes,
      stages: [
        {
          id: `timer_stage_${task.id}`,
          order: 1,
          name: 'Timer Masak',
          durationMin: timerMinutes,
          durationSec: 0,
          instruction: 'Mulai hitung mundur sesuai durasi ini.',
          autoNext: false,
        },
      ],
    } as const;
  }, [cookingTemplate, timerMinutes, task.id, task.title]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveDuration = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditingDuration(false);
    await updateTask(task.id, { timerDurationMin: durationMinutes });
  };

  const handlePlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    startSession(effectiveTemplate as CookingTemplate);
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditingDuration(true);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 mb-3 bg-card rounded-xl border border-border shadow-sm transition-all",
        isDragging ? "opacity-50 z-50 shadow-lg scale-105" : "hover:shadow-md hover:border-primary/20"
      )}
    >
      {/* Handle untuk Drag Area (Hanya di icon grip ini dnd aktif) */}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-md touch-none min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <p className={clsx("text-sm font-medium", task.status === 'completed' ? "line-through text-sand-400" : "text-foreground")}>
          {task.title}
        </p>
        {task.notes && <p className="text-xs text-sand-500 mt-0.5 line-clamp-1">{task.notes}</p>}
      </div>

      <div className="flex flex-col items-end gap-2 text-right">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-border bg-muted/50 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-foreground shadow-sm">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          <span className="whitespace-nowrap">{timerMinutes} Menit</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {task.cookingTemplateId && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCustomizingTemplateId(task.cookingTemplateId || null);
              }}
              className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-rose-200 dark:border-rose-800/30 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition hover:border-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
              title="Buka resep masak"
            >
              <ChefHat className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleEditClick}
            className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            title="Ubah durasi"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handlePlayClick}
            className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-rose-600 dark:bg-rose-500 text-white shadow-sm shadow-rose-600/30 transition hover:bg-rose-700 dark:hover:bg-rose-600 hover:scale-105 active:scale-95"
            title="Mulai timer"
          >
            <Play className="h-4 w-4 fill-white" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsCopyTaskOpen(true);
            }}
            className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            title="Salin tugas ke beberapa tanggal"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDeleting(true);
            }}
            className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
            title="Hapus tugas"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {isEditingDuration && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Durasi</span>
            </div>
            <input
              type="number"
              min={1}
              max={240}
              value={durationMinutes}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDurationMinutes(value > 0 ? value : 1);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-14 rounded-2xl border border-border bg-card px-2.5 py-1.5 text-right text-sm font-semibold text-foreground outline-none focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">mnt</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleSaveDuration}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition hover:opacity-90"
              title="Simpan durasi"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <CopyTaskDialog
        task={task}
        isOpen={isCopyTaskOpen}
        onOpenChange={setIsCopyTaskOpen}
      />

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tugas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tugas &ldquo;<span className="font-semibold text-foreground">{task.title}</span>&rdquo; akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}