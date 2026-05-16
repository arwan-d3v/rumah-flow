import { create } from 'zustand';
import { Task } from '@/types/schema';
import { Timestamp } from 'firebase/firestore';

interface TaskState {
  tasks: Task[];
  moveTask: (taskId: string, newSection: Task['section']) => void;
}

// Dummy data agar bisa langsung ditest drag & drop
const dummyTasks: Task[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Siapkan Bekal Anak',
    status: 'todo',
    section: 'morning',
    date: new Date().toISOString().split('T')[0],
    order: 0,
    isRecurring: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Masak Sop Buntut (Slow Cooker)',
    notes: 'Resep dari mertua',
    status: 'todo',
    section: 'meals',
    date: new Date().toISOString().split('T')[0],
    order: 0,
    isRecurring: false,
    cookingTemplateId: 'template_sop', // Ini nanti untuk trigger fitur Cooking Mode
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Cuci Pakaian Putih',
    status: 'todo',
    section: 'chores',
    date: new Date().toISOString().split('T')[0],
    order: 0,
    isRecurring: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
];

export const useTaskStore = create<TaskState>((set) => ({
  tasks: dummyTasks,
  moveTask: (taskId, newSection) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, section: newSection } : task
      ),
    })),
}));