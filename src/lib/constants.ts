import { CookingTemplate } from '@/types/schema';

export const DEFAULT_COOKING_TEMPLATES: CookingTemplate[] = [
  {
    id: 'template_masak_nasi',
    name: 'Masak Nasi Perfect',
    totalDurationMin: 35,
    stages: [
      { id: 'nasi_1', order: 1, name: 'Persiapan & Cuci Beras', durationMin: 5, durationSec: 0, instruction: 'Cuci beras maksimal 3x. Pastikan takaran air pas.', autoNext: false },
      { id: 'nasi_2', order: 2, name: 'Proses Perendaman', durationMin: 15, durationSec: 0, instruction: 'Diamkan beras terendam air agar lebih pulen.', autoNext: true },
      { id: 'nasi_3', order: 3, name: 'Masak (Rice Cooker)', durationMin: 15, durationSec: 0, instruction: 'Tekan tombol COOK. Tunggu hingga matang.', autoNext: false }
    ]
  },
  {
    id: 'template_sop', // INI YANG DICARI OLEH TOMBOL TADI!
    name: 'Sop Buntut Gurih',
    totalDurationMin: 90,
    stages: [
      { id: 'sop_1', order: 1, name: 'Presto Buntut', durationMin: 45, durationSec: 0, instruction: 'Presto daging buntut dengan jahe dan garam agar dagingnya empuk luar dalam.', autoNext: false },
      { id: 'sop_2', order: 2, name: 'Tumis Bumbu Halus', durationMin: 5, durationSec: 0, instruction: 'Tumis bawang putih, bawang merah, dan pala parut sampai harum kecoklatan.', autoNext: false },
      { id: 'sop_3', order: 3, name: 'Rebus Bersama Sayuran', durationMin: 40, durationSec: 0, instruction: 'Masukkan wortel, kentang, dan bumbu tumis ke air kaldu. Rebus dengan api sedang.', autoNext: true }
    ]
  }
];