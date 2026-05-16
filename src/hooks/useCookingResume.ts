'use client';

import { useEffect } from 'react';
import { useCookingStore } from '@/store/useCookingStore';

export function useCookingResume() {
  const { activeTemplate, syncOfflineTime } = useCookingStore();

  useEffect(() => {
    if (activeTemplate) {
      // Jalankan sinkronisasi waktu sekali saat app di-load
      syncOfflineTime();
    }
  }, [activeTemplate, syncOfflineTime]);
}