import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Holiday {
  date: string; // Format: YYYY-MM-DD
  name: string;
  isNationalHoliday: boolean;
}

interface HolidayState {
  holidays: Holiday[];
  fetchHolidays: (year: number) => Promise<void>;
  getHolidayByDate: (dateStr: string) => Holiday | undefined;
}

export const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      holidays: [],
      
      fetchHolidays: async (year) => {
        try {
          // Di level produksi, kita bisa fetch dari API publik:
          // const res = await fetch(`https://dayoffapi.vercel.app/api?year=${year}`);
          // const data = await res.json();
          
          // Untuk keamanan testing saat ini, kita gunakan fallback data Statis Tahun 2026
          // (Sengaja saya masukkan tanggal 17 Mei 2026 agar langsung terlihat di kalender Anda)
          const mockHolidays2026: Holiday[] = [
            { date: '2026-05-01', name: 'Hari Buruh Internasional', isNationalHoliday: true },
            { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', isNationalHoliday: true },
            { date: '2026-05-17', name: 'Cuti Bersama (Simulasi)', isNationalHoliday: true },
            { date: '2026-06-01', name: 'Hari Lahir Pancasila', isNationalHoliday: true },
            { date: '2026-08-17', name: 'Hari Kemerdekaan RI', isNationalHoliday: true },
          ];
          
          set({ holidays: mockHolidays2026 });
        } catch (error) {
          console.error("Gagal mengambil data libur", error);
        }
      },
      
      getHolidayByDate: (dateStr) => {
        return get().holidays.find(h => h.date === dateStr);
      }
    }),
    { name: 'rumah-flow-holidays' } // Simpan di localstorage agar tidak fetch API berulang kali
  )
);