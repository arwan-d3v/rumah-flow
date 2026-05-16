export const DEFAULT_COOKING_TEMPLATES = [
  {
    id: 'template_masak_nasi',
    name: 'Masak Nasi Perfect',
    totalDurationMin: 35,
    stages: [
      { 
        id: 'nasi_1', 
        order: 1, 
        name: 'Persiapan & Cuci Beras', 
        durationMin: 5, 
        durationSec: 0, 
        instruction: 'Cuci beras maksimal 3x. Pastikan takaran air setinggi satu ruas jari di atas permukaan beras.',
        autoNext: false // Ibu perlu konfirmasi kalau sudah selesai cuci tangan
      },
      { 
        id: 'nasi_2', 
        order: 2, 
        name: 'Proses Perendaman', 
        durationMin: 15, 
        durationSec: 0, 
        instruction: 'Diamkan beras terendam air. Ini rahasia agar nasi lebih pulen dan matang merata.',
        autoNext: true // Otomatis lanjut ke masak setelah 15 menit
      },
      { 
        id: 'nasi_3', 
        order: 3, 
        name: 'Masak (Rice Cooker)', 
        durationMin: 15, 
        durationSec: 0, 
        instruction: 'Tekan tombol COOK. Tunggu hingga tombol pindah ke WARM. Jangan buka tutupnya dulu setelah matang.',
        autoNext: false // Berhenti di sini untuk alarm final
      }
    ]
  }
];