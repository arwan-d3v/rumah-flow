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

  return (
    <div className="flex items-center justify-between gap-2 md:gap-4 bg-white p-2 rounded-3xl shadow-sm border border-sand-100">
      <button onClick={() => onChange(subDays(selectedDate, 1))} className="p-2 text-sand-400 hover:text-sage-500 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-1 justify-between overflow-x-auto no-scrollbar gap-2 px-2">
        {days.map((date, idx) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // FASE 3: Cek apakah tanggal ini adalah hari libur nasional
          const holiday = getHolidayByDate(dateStr);
          const isHoliday = !!holiday;

          return (
            <button
              key={idx}
              onClick={() => onChange(date)}
              className={`flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-2xl transition-all ${
                isSelected 
                  ? 'bg-sage-500 text-white shadow-md shadow-sage-900/20 scale-105' 
                  : 'bg-transparent text-sand-600 hover:bg-sand-50'
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