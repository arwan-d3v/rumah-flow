'use client';

import { format, addDays, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHolidayStore } from '@/store/useHolidayStore'; // IMPORT STORE BARU

interface Props {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export function HorizontalDatePicker({ selectedDate, onChange }: Props) {
  const getHolidayByDate = useHolidayStore(state => state.getHolidayByDate);

  // Buat array 7 hari (3 hari sebelum, hari H, 3 hari sesudah)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  // Show only 5 days on mobile: selectedDate ± 2, rest hidden via CSS
  return (
    <div className="flex items-center justify-between gap-1 md:gap-4 bg-card px-2 md:px-3 py-2 rounded-3xl shadow-sm border border-border">
      <button onClick={() => onChange(subDays(selectedDate, 1))} className="p-2 md:p-2.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-1 justify-center overflow-x-auto no-scrollbar gap-0.5 md:gap-2 px-0.5 md:px-2">
        {days.map((date, idx) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayDiff = Math.abs(date.getDate() - selectedDate.getDate());
          const isVisibleOnMobile = dayDiff <= 2; // Only show ±2 days on mobile
          
          // FASE 3: Cek apakah tanggal ini adalah hari libur nasional
          const holiday = getHolidayByDate(dateStr);
          const isHoliday = !!holiday;

          return (
            <button
              key={idx}
              onClick={() => onChange(date)}
              className={`flex-col items-center justify-center w-11 md:min-w-[3.5rem] h-14 md:h-16 rounded-2xl transition-all shrink-0 ${
                !isVisibleOnMobile && !isSelected ? 'hidden' : 'flex'
              } ${
                isSelected 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105' 
                  : 'bg-transparent text-foreground/70 hover:bg-muted'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isHoliday && !isSelected ? 'text-rose-500' : ''}`}>
                {format(date, 'E', { locale: id })}
              </span>
              <span className={`text-xl font-semibold mt-0.5 ${isHoliday && !isSelected ? 'text-rose-600' : ''}`}>
                {format(date, 'd')}
              </span>
              
              {/* Indikator Titik Merah Hari Libur */}
              {isHoliday && (
                <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      <button onClick={() => onChange(addDays(selectedDate, 1))} className="p-2 text-sand-400 hover:text-sage-500 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}