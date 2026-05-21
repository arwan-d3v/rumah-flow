import { create } from 'zustand';
import { Task, SectionType } from '@/types/schema';
import { db } from '@/lib/firebase/config';
import { 
  collection, doc, setDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot 
} from 'firebase/firestore';
import { toast } from 'sonner';

interface TaskState {
  tasks: Task[];
  isTasksLoading: boolean;
  
  // Real-time Listener
  subscribeToTasks: (userId: string) => () => void;
  
  // CRUD Actions
  addTask: (task: Task) => Promise<void>;
  moveTask: (taskId: string, newSection: SectionType) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, payload: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isTasksLoading: true,

  // 1. MENDENGARKAN PERUBAHAN DATABASE SECARA REAL-TIME
  subscribeToTasks: (userId) => {
    set({ isTasksLoading: true });
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Task[];
      
      set({ tasks: tasksData, isTasksLoading: false });
    }, (error) => {
      console.error("Gagal sinkronisasi data:", error);
      toast.error("Koneksi database terputus.");
      set({ isTasksLoading: false });
    });

    return unsubscribe; // Mengembalikan fungsi untuk membersihkan listener saat user logout
  },

  // 2. TAMBAH TUGAS KE CLOUD
  addTask: async (task) => {
    try {
      const docRef = doc(collection(db, 'tasks'), task.id);
      await setDoc(docRef, task);
      toast.success("Tugas berhasil ditambahkan!");
    } catch (error) {
      console.error("Gagal menambah tugas:", error);
      toast.error("Gagal menyimpan tugas.");
    }
  },

  // 3. GESER TUGAS (DRAG & DROP)
  moveTask: async (taskId, newSection) => {
    // Optimistic UI Update: Ubah di layar duluan agar animasi drag & drop tetap mulus tanpa lag
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, section: newSection } : task
      ),
    }));

    // Update secara background ke Firebase
    try {
      const docRef = doc(db, 'tasks', taskId);
      await updateDoc(docRef, { section: newSection, updatedAt: Date.now() });
    } catch (error) {
      console.error("Gagal memindahkan tugas:", error);
      toast.error("Gagal memindahkan tugas. Sistem akan memuat ulang.");
    }
  },

  // 4. CEKLIS TUGAS SELESAI
  toggleTaskStatus: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    // Optimistic Update
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status: newStatus } : t),
    }));

    try {
      const docRef = doc(db, 'tasks', taskId);
      await updateDoc(docRef, { status: newStatus, updatedAt: Date.now() });
    } catch (error) {
      console.error("Gagal update status:", error);
    }
  },

  updateTask: async (taskId, payload) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...payload, updatedAt: Date.now() } : task
      ),
    }));

    try {
      const docRef = doc(db, 'tasks', taskId);
      await updateDoc(docRef, { ...payload, updatedAt: Date.now() });
      toast.success('Perubahan task tersimpan.');
    } catch (error) {
      console.error('Gagal memperbarui task:', error);
      toast.error('Gagal memperbarui task.');
    }
  },

  // 5. HAPUS TUGAS
  deleteTask: async (taskId) => {
    try {
      const docRef = doc(db, 'tasks', taskId);
      await deleteDoc(docRef);
      toast.success("Tugas dihapus.");
    } catch (error) {
      console.error("Gagal menghapus tugas:", error);
    }
  }
}));