'use client';

import { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CookingTemplate, Task } from '@/types/schema';
import { GripVertical, Play, Pencil, Check, Clock, MoreVertical, ChefHat } from 'lucide-react';
import { clsx } from 'clsx';
import { useCookingStore } from '@/store/useCookingStore';
import { useTaskStore } from '@/store/useTaskStore';
import { DEFAULT_COOKING_TEMPLATES } from '@/lib/constants';
import { CopyTaskDialog } from './CopyTaskDialog';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const setCustomizingTemplateId = useCookingStore((state) => state.setCustomizingTemplateId);
  const startSession = useCookingStore((state) => state.startSession);
  const updateTask = useTaskStore((state) => state.updateTask);

  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [isCopyTaskOpen, setIsCopyTaskOpen] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(task.timerDurationMin ?? 30);

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
        "group relative flex items-center gap-3 p-3 mb-3 bg-white rounded-xl border border-sand-100 shadow-sm transition-all",
        isDragging ? "opacity-50 z-50 shadow-lg scale-105" : "hover:shadow-md hover:border-sand-200"
      )}
    >
      {/* Handle untuk Drag Area (Hanya di icon grip ini dnd aktif) */}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-sand-300 hover:text-sage-500 rounded-md touch-none"
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
        <div className="inline-flex items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs font-semibold text-sand-700 shadow-sm">
          <Clock className="h-4 w-4 text-sage-600" />
          <span>{timerMinutes} Menit</span>
        </div>

        <div className="flex items-center gap-2">
          {task.cookingTemplateId && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCustomizingTemplateId(task.cookingTemplateId || null);
              }}
              className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
              title="Buka resep masak"
            >
              <ChefHat className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleEditClick}
            className="inline-flex h-9 items-center justify-center rounded-2xl border border-sand-200 bg-white px-3 text-sand-600 transition hover:border-sage-300 hover:text-sage-700"
            title="Ubah durasi"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handlePlayClick}
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-sage-600 px-3 text-white transition hover:bg-sage-700"
            title="Mulai timer"
          >
            <Play className="h-4 w-4" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsCopyTaskOpen(true);
            }}
            className="inline-flex h-9 items-center justify-center rounded-2xl border border-sand-200 bg-white px-3 text-sand-600 transition hover:border-sage-300 hover:text-sage-700"
            title="Salin tugas ke beberapa tanggal"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {isEditingDuration && (
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-sage-200 bg-sage-50 px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sand-700">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Durasi</span>
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
              className="w-16 rounded-2xl border border-sand-200 bg-white px-3 py-2 text-right text-sm font-semibold text-sand-900 outline-none focus:border-sage-500"
            />
            <span className="text-xs text-sand-500">mnt</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleSaveDuration}
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-sage-600 px-3 text-white transition hover:bg-sage-700"
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
    </div>
  );
}