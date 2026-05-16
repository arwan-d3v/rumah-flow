'use client';

import { useState } from 'react';
import { CookingTemplate, CookingStage } from '@/types/schema';
import { useCookingStore } from '@/store/useCookingStore';
import { DEFAULT_COOKING_TEMPLATES } from '@/lib/constants';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Play, Settings2, Sliders, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeCustomizerDialog({ templateId, isOpen, onClose }: Props) {
  const baseTemplate = DEFAULT_COOKING_TEMPLATES.find(t => t.id === templateId);
  const startSession = useCookingStore((state) => state.startSession);

  // Local state untuk menampung modifikasi resep sebelum disimulasikan
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [recipeName, setRecipeName] = useState(baseTemplate?.name || '');
  const [stages, setStages] = useState<CookingStage[]>(baseTemplate?.stages || []);

  if (!baseTemplate) return null;

  // Reset ke pengaturan pabrik (Default Masak Nasi)
  const handleResetToDefault = () => {
    setRecipeName(baseTemplate.name);
    setStages(JSON.parse(JSON.stringify(baseTemplate.stages))); // Deep clone
    setIsCustomMode(false);
    toast.success('Kembali ke resep default bawaan.');
  };

  // Mengubah data field stage kustom
  const handleUpdateStage = (id: string, field: keyof CookingStage, value: any) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === id) {
        const updated = { ...stage, [field]: value };
        // Validasi input angka durasi
        if (field === 'durationMin' || field === 'durationSec') {
          updated[field] = Math.max(0, parseInt(value) || 0);
        }
        return updated;
      }
      return stage;
    }));
  };

  // Menambah section/tahap masak baru secara dinamis
  const handleAddStage = () => {
    const newStage: CookingStage = {
      id: `custom_${Date.now()}`,
      order: stages.length + 1,
      name: `Langkah Baru ${stages.length + 1}`,
      durationMin: 2,
      durationSec: 0,
      instruction: 'Tulis instruksi pengerjaan di sini.',
      autoNext: false
    };
    setStages([...stages, newStage]);
  };

  // Menghapus section tertentu
  const handleRemoveStage = (id: string) => {
    if (stages.length <= 1) {
      toast.error("Minimal harus ada 1 langkah memasak!");
      return;
    }
    const filtered = stages.filter(s => s.id !== id);
    // Tata ulang urutan order nomor langkah
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
  };

  // Eksekusi masuk ke Cooking Mode
  const handleLaunchSimulation = () => {
    // Hitung total durasi kustom
    const totalDuration = stages.reduce((acc, s) => acc + s.durationMin, 0);
    
    const finalizedTemplate: CookingTemplate = {
      id: baseTemplate.id,
      name: recipeName,
      totalDurationMin: totalDuration,
      stages: stages
    };

    startSession(finalizedTemplate);
    onClose();
    toast.success(`Sesi "${finalizedTemplate.name}" dimulai!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-sand-50 rounded-[2rem] border-none shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-sand-900">
              {isCustomMode ? 'Kustomisasi Sesi Masak' : 'Persiapan Memasak'}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="rounded-xl border-sand-200 bg-white gap-2 text-xs font-semibold"
            >
              {isCustomMode ? <Sliders className="w-4 h-4 text-sage-500" /> : <Settings2 className="w-4 h-4 text-sand-500" />}
              {isCustomMode ? 'Lihat Ringkasan' : 'Ubah Durasi & Judul'}
            </Button>
          </div>
          <DialogDescription className="text-sand-600">
            {isCustomMode 
              ? 'Anda bebas mengatur ulang waktu, nama section, dan instruksi sesuai takaran bahan Anda sendiri hari ini.' 
              : 'Menyiapkan urutan langkah otomatis untuk memandu Anda di dapur tanpa hambatan.'}
          </DialogDescription>
        </DialogHeader>

        <Separator className="bg-sand-200/60 my-2" />

        {/* Form Area */}
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sand-700 font-bold">Nama Menu / Masakan</Label>
            <Input 
              value={recipeName}
              disabled={!isCustomMode}
              onChange={(e) => setRecipeName(e.target.value)}
              className="bg-white border-sand-200 rounded-xl focus-visible:ring-sage-500 font-medium"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sand-700 font-bold flex justify-between items-center">
              <span>Urutan Langkah & Timing Kontrol</span>
              {isCustomMode && (
                <Button variant="ghost" onClick={handleResetToDefault} className="text-xs text-rose-500 hover:text-rose-600 gap-1 h-7 px-2">
                  <RefreshCw className="w-3 h-3" /> Reset Default
                </Button>
              )}
            </Label>

            {/* Render Stages List */}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              {stages.map((stage, idx) => (
                <div 
                  key={stage.id} 
                  className="bg-white p-4 rounded-2xl border border-sand-100 shadow-sm space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        value={stage.name}
                        disabled={!isCustomMode}
                        onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                        className="h-8 border-none p-0 bg-transparent font-semibold text-sm focus-visible:ring-0 text-foreground disabled:opacity-100"
                        placeholder="Nama Tahapan"
                      />
                    </div>

                    {/* Timer Config Inputs */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-sand-50 rounded-lg border border-sand-200 px-2 h-8 w-16">
                        <input
                          type="number"
                          value={stage.durationMin}
                          disabled={!isCustomMode}
                          onChange={(e) => handleUpdateStage(stage.id, 'durationMin', e.target.value)}
                          className="w-full bg-transparent font-mono text-xs text-center border-none outline-none focus:ring-0"
                        />
                        <span className="text-[10px] font-bold text-sand-400">m</span>
                      </div>
                      <div className="flex items-center bg-sand-50 rounded-lg border border-sand-200 px-2 h-8 w-16">
                        <input
                          type="number"
                          value={stage.durationSec}
                          disabled={!isCustomMode}
                          onChange={(e) => handleUpdateStage(stage.id, 'durationSec', e.target.value)}
                          className="w-full bg-transparent font-mono text-xs text-center border-none outline-none focus:ring-0"
                        />
                        <span className="text-[10px] font-bold text-sand-400">s</span>
                      </div>

                      {isCustomMode && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveStage(stage.id)}
                          className="w-8 h-8 rounded-lg text-sand-400 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Instruction Input */}
                  <textarea
                    value={stage.instruction}
                    disabled={!isCustomMode}
                    onChange={(e) => handleUpdateStage(stage.id, 'instruction', e.target.value)}
                    rows={2}
                    className="w-full bg-sand-50/50 disabled:bg-transparent rounded-xl text-xs text-sand-600 p-2.5 border border-sand-100 focus:outline-none focus:border-sage-300 resize-none leading-relaxed disabled:p-0 disabled:border-none"
                    placeholder="Instruksi pengerjaan..."
                  />

                  {/* Toggle AutoNext */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`autoNext_${stage.id}`}
                      checked={stage.autoNext}
                      disabled={!!isCustomMode ? false : true}
                      onChange={(e) => handleUpdateStage(stage.id, 'autoNext', e.target.checked)}
                      className="w-3.5 h-3.5 accent-sage-500 rounded border-sand-300 focus:ring-sage-400 cursor-pointer disabled:opacity-80"
                    />
                    <label 
                      htmlFor={`autoNext_${stage.id}`} 
                      className="text-[11px] font-medium text-sand-500 cursor-pointer select-none"
                    >
                      Otomatis lanjut ke langkah berikutnya ketika waktu habis (Hands-free)
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {isCustomMode && (
              <Button 
                type="button"
                variant="outline" 
                onClick={handleAddStage}
                className="w-full h-10 border-dashed border-sand-300 rounded-xl text-xs font-semibold text-sand-600 hover:bg-white gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Tahapan Masak
              </Button>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl text-sand-500"
          >
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleLaunchSimulation}
            className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-semibold gap-2 shadow-md px-6"
          >
            <Play className="w-4 h-4 fill-current" /> Mulai Memasak Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}