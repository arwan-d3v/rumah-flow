'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/schema';
import { GripVertical, ChefHat, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { useCookingStore } from '@/store/useCookingStore';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const setCustomizingTemplateId = useCookingStore((state) => state.setCustomizingTemplateId);

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative flex items-center gap-3 p-3 mb-3 bg-white rounded-xl border border-sand-100 shadow-sm transition-all",
        isDragging ? "opacity-50 z-50 shadow-lg scale-105" : "hover:shadow-md hover:border-sand-200"
      )}
    >
      {/* Handle untuk Drag */}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-sand-300 hover:text-sage-500 rounded-md"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <p className={clsx("text-sm font-medium", task.status === 'completed' ? "line-through text-sand-400" : "text-foreground")}>
          {task.title}
        </p>
        {task.notes && <p className="text-xs text-sand-500 mt-0.5 line-clamp-1">{task.notes}</p>}
      </div>

      {/* Tombol Masak (Memicu State Global) */}
      {task.cookingTemplateId && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop dnd-kit pointer event bubble
            setCustomizingTemplateId(task.cookingTemplateId || null);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg text-rose-500 transition-colors cursor-pointer group/btn z-10"
          title="Buka Menu Masak"
        >
          <ChefHat className="w-4 h-4 group-hover/btn:hidden" />
          <Play className="w-4 h-4 hidden group-hover/btn:block fill-current" />
          <span className="text-xs font-bold pr-1">Masak</span>
        </button>
      )}
    </div>
  );
}