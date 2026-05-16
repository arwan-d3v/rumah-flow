'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/types/schema';
import { TaskCard } from './TaskCard';

interface TaskSectionProps {
  id: string;
  title: string;
  colorClass: string;
  tasks: Task[];
}

export function TaskSection({ id, title, colorClass, tasks }: TaskSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'Section', sectionId: id }
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sand-900 px-2">{title}</h3>
        <span className="text-xs font-semibold bg-white px-2 py-1 rounded-lg text-sand-500 shadow-sm">
          {tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`min-h-[150px] rounded-[1.5rem] p-4 border transition-colors ${
          isOver ? 'border-sage-500 bg-sage-50/50' : 'border-white/60 border-dashed'
        } ${colorClass} shadow-inner`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="h-full w-full flex items-center justify-center opacity-50">
              <p className="text-sm text-sand-500 font-medium">Tarik tugas ke sini</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}