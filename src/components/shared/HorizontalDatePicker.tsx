'use client';

import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export function HorizontalDatePicker({ selectedDate, onChange }: Props) {
  const [dates, setDates] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 15 hari ke belakang dan 15 hari ke depan dari hari ini
  useEffect(() => {
    const today = new Date();
    const generatedDates = [];
    for (let i = -15; i <= 15; i++) {
      generatedDates.push(i === 0 ? today : i < 0 ? subDays(today, Math.abs(i)) : addDays(today, i));
    }
    setDates(generatedDates);
  }, []);

  // Auto-scroll ke tanggal yang dipilih saat komponen dimuat
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [dates, selectedDate]);

  return (
    <div className="flex items-center gap-2 w-full max-w-full">
      <button 
        onClick={() => onChange(subDays(selectedDate, 1))}
        className="p-2 text-sand-500 hover:text-sage-500 hover:bg-sage-50 rounded-full transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex-1 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-4 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date, idx) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={idx}
              data-active={isSelected}
              onClick={() => onChange(date)}
              className={clsx(
                "snap-center flex flex-col items-center justify-center min-w-[4rem] h-[5rem] rounded-[1.25rem] transition-all duration-300",
                isSelected 
                  ? "bg-sage-500 text-white shadow-md shadow-sage-900/10 scale-105" 
                  : "bg-white text-sand-900 hover:bg-sand-50 border border-sand-100"
              )}
            >
              <span className={clsx("text-xs font-medium uppercase mb-1", isSelected ? "text-sage-100" : "text-sand-500")}>
                {format(date, 'EEE', { locale: id })}
              </span>
              <span className={clsx("text-xl font-semibold", isToday && !isSelected && "text-rose-500")}>
                {format(date, 'd')}
              </span>
              {isToday && (
                <div className={clsx("w-1 h-1 rounded-full mt-1", isSelected ? "bg-white" : "bg-rose-500")} />
              )}
            </button>
          );
        })}
      </div>

      <button 
        onClick={() => onChange(addDays(selectedDate, 1))}
        className="p-2 text-sand-500 hover:text-sage-500 hover:bg-sage-50 rounded-full transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}