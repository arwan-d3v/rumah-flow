export const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/chime.mp3'); 
    audio.volume = 0.7; // Volume yang soft dan calming
    audio.play().catch((err) => console.log('Audio play di-block oleh browser:', err));
  } catch (error) {
    console.error('Gagal memutar audio', error);
  }
};