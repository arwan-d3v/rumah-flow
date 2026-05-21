'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, SectionType } from '@/types/schema';
import { TaskCard } from './TaskCard';
import { Plus, X } from 'lucide-react';

interface TaskSectionProps {
  id: string;
  title: string;
  colorClass: string;
  tasks: Task[];
  showInlineAdd?: boolean;
  onAddTask?: (title: string, section: SectionType) => void;
}

export function TaskSection({ id, title, colorClass, tasks, showInlineAdd = false, onAddTask }: TaskSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'Section', sectionId: id }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddTask?.(trimmed, id as SectionType);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground px-2">{title}</h3>
        <span className="text-xs font-semibold bg-card px-2 py-1 rounded-lg text-muted-foreground shadow-sm border border-border">
          {tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`min-h-[150px] rounded-[1.5rem] p-4 border transition-colors ${
          isOver ? 'border-primary/50 bg-primary/5' : 'border-border/60 border-dashed'
        } ${colorClass} dark:bg-opacity-30`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && !isAdding && (
            <div className="h-full w-full flex items-center justify-center opacity-50">
              <p className="text-sm text-muted-foreground font-medium">Tarik tugas ke sini</p>
            </div>
          )}
        </SortableContext>

        {/* Inline Add Form */}
        {isAdding && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-card p-2 shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-200">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Tambah ${title.toLowerCase()}...`}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground px-2 py-1"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!newTitle.trim()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40 min-w-[44px]"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setNewTitle(''); }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Ghost Button — "Tambah Rutinitas" for Daily Plan mode */}
      {showInlineAdd && !isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 w-full rounded-2xl border border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 min-h-[48px]"
        >
          <Plus className="h-4 w-4" />
          Tambah {title.toLowerCase()}
        </button>
      )}
    </div>
  );
}
