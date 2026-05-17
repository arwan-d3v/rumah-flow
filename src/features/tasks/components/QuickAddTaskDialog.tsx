'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { SectionType } from '@/types/schema';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Loader2, ChefHat, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { DEFAULT_COOKING_TEMPLATES } from '@/lib/constants'; 

const SECTIONS: { id: SectionType; title: string; color: string }[] = [
  { id: 'morning', title: 'Morning Routine', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'meals', title: 'Meals & Cooking', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'chores', title: 'House Chores', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'family', title: 'Kids & Family', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'self-care', title: 'Self-care', color: 'bg-sage-100 text-sage-700 border-sage-200' },
  { id: 'errands', title: 'Errands', color: 'bg-sand-100 text-sand-700 border-sand-200' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDateStr: string;
}

export function QuickAddTaskDialog({ isOpen, onClose, selectedDateStr }: Props) {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState<SectionType>('chores');
  const [isDaily, setIsDaily] = useState(false); // State rutinitas harian
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(''); // State khusus Timer Masak
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const addTask = useTaskStore((state) => state.addTask);
  const tasks = useTaskStore((state) => state.tasks);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    
    try {
      const newTask = {
        id: `task_${Date.now()}`,
        userId: user.uid,
        title: title.trim(),
        status: 'todo' as const,
        section: section,
        targetDate: selectedDateStr,
        
        // PERBAIKAN TYPESCRIPT DI BARIS BAWAH INI:
        recurrence: (isDaily ? 'daily' : 'none') as 'daily' | 'none',
        
        order: tasks.filter(t => t.targetDate === selectedDateStr && t.section === section).length,
        ...(section === 'meals' && selectedTemplateId ? { cookingTemplateId: selectedTemplateId } : {}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addTask(newTask);

      
      // Reset form agar bersih saat dibuka kembali
      setTitle(''); 
      setSection('chores');
      setSelectedTemplateId('');
      setIsDaily(false); // Reset toggle harian
      
      onClose(); // Tutup dialog segera setelah sukses
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setIsSubmitting(false); // Jaminan Mutlak: Matikan loading seketika, apapun yang terjadi
    }
  };

  const displayDate = format(new Date(selectedDateStr), 'd MMMM yyyy', { locale: id });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-[2rem] p-6 border-none shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold text-sand-900">Buat Tugas Baru</DialogTitle>
          <DialogDescription className="text-sand-500">
            Ditambahkan untuk jadwal tanggal <strong className="text-sage-600">{displayDate}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Input Nama Tugas */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-sand-700">Nama Tugas / Pekerjaan</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Masak Sop Buntut, Cuci Sprei..."
              className="h-12 bg-sand-50 border-transparent focus-visible:ring-sage-500 rounded-xl text-base"
              maxLength={60}
            />
          </div>

          {/* Pemilihan Kategori */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-sand-700">Pilih Kategori</label>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setSection(sec.id);
                    // Reset pilihan template masak jika berpindah dari kategori Meals
                    if (sec.id !== 'meals') setSelectedTemplateId('');
                  }}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                    section === sec.id 
                      ? `${sec.color} ring-2 ring-offset-1 ring-current opacity-100 scale-105 shadow-sm` 
                      : "bg-white border-sand-200 text-sand-500 hover:bg-sand-50 opacity-70"
                  )}
                >
                  {sec.title}
                </button>
              ))}
            </div>
          </div>

          {/* FITUR BARU: Opsi Timer Memasak Khusus untuk Kategori 'Meals & Cooking' */}
          {section === 'meals' && (
            <div className="space-y-2.5 p-4 bg-rose-50/50 border border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-bold text-rose-800 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4" /> Mode Asisten Memasak (Timer)
              </label>
              <p className="text-xs text-rose-600/80 mb-2">Gunakan panduan waktu presisi agar masakan tidak *overcook*.</p>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateId('')}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                    selectedTemplateId === '' 
                      ? "bg-rose-100 border-rose-300 text-rose-800" 
                      : "bg-white border-sand-200 text-sand-600 hover:bg-sand-50"
                  )}
                >
                  <span>Tanpa Timer (Manual)</span>
                </button>

                {DEFAULT_COOKING_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      // Otomatis menyingkronkan judul form dengan nama resep jika belum diisi panjang
                      if (title === '' || title === 'Masak Nasi') setTitle(tmpl.name);
                    }}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                      selectedTemplateId === tmpl.id 
                        ? "bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-900/10" 
                        : "bg-white border-sand-200 text-sand-600 hover:bg-sand-50"
                    )}
                  >
                    <span className="truncate pr-2">{tmpl.name}</span>
                    <span className={clsx("flex items-center gap-1 text-xs shrink-0", selectedTemplateId === tmpl.id ? "text-rose-100" : "text-sand-400")}>
                      <Clock className="w-3.5 h-3.5" /> {tmpl.totalDurationMin} mnt
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FITUR BARU: Toggle Rutinitas Harian */}
          <div className="flex items-center gap-3 p-3 bg-sand-50/50 rounded-xl border border-sand-100">
            <input
              type="checkbox"
              id="daily-toggle"
              checked={isDaily}
              onChange={(e) => setIsDaily(e.target.checked)}
              className="w-5 h-5 accent-sage-500 rounded border-sand-300 focus:ring-sage-400 cursor-pointer"
            />
            <label htmlFor="daily-toggle" className="text-sm font-medium text-sand-600 cursor-pointer select-none">
              Jadikan Rutinitas Harian <span className="text-xs font-normal text-sand-400 block">(Akan otomatis muncul setiap hari)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 rounded-xl text-sand-500 hover:bg-sand-50"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || isSubmitting}
              className="flex-1 rounded-xl bg-sage-500 hover:bg-sage-600 text-white shadow-md font-semibold transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-1" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
