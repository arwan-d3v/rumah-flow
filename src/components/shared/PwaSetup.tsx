'use client';

import { useEffect, useState } from 'react';
import { Bell, Download, Home, X } from 'lucide-react';
import { toast } from 'sonner';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const FCM_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

export function PwaSetup() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      toast.success('Rumah Flow sudah siap di layar utama!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('PWA service worker registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('Gagal mendaftar service worker PWA:', error);
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (permissionState === 'granted' && !token) {
      isSupported()
        .then((supported) => {
          if (!supported) {
            toast.error('Notifikasi browser tidak didukung di perangkat ini.');
            return;
          }

          const messaging = getMessaging(app);
          return getToken(messaging, {
            vapidKey: FCM_VAPID_KEY || undefined,
          })
            .then((currentToken) => {
              if (currentToken) {
                setToken(currentToken);
                console.info('FCM token diterima:', currentToken);
                toast.success('Notifikasi diaktifkan untuk Rumah Flow.');
                onMessage(messaging, (payload) => {
                  console.info('Pesan masuk:', payload);
                  toast('Ada pemberitahuan baru dari Rumah Flow.', {
                    description: payload.notification?.body || 'Buka aplikasi untuk melihat detail.',
                  });
                });
              }
            })
            .catch((err) => {
              console.warn('Tidak dapat mengambil token FCM:', err);
            });
        })
        .catch((err) => {
          console.warn('FCM tidak didukung:', err);
        });
    }
  }, [permissionState, token]);

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifikasi tidak tersedia di browser ini.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        toast.success('Izin notifikasi disetujui.');
      } else if (permission === 'denied') {
        toast.error('Izin notifikasi ditolak.');
      }
    } catch (error) {
      console.error('Gagal meminta permission notifikasi:', error);
      toast.error('Tidak dapat meminta izin notifikasi.');
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    const promptEvent = installPrompt;
    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
      toast.success('Terima kasih! Silakan pasang Rumah Flow ke layar utama.');
    }

    setInstallPrompt(null);
  };

  if (!showBanner && permissionState === 'granted') return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(96%,420px)] -translate-x-1/2 rounded-3xl border border-sand-200 bg-white/95 p-4 shadow-2xl shadow-sand-950/10 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-2xl bg-sage-50 p-3 text-sage-700">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-sand-900">Rumah Flow seperti app native</p>
              <p className="mt-1 text-xs text-sand-500">Pasang ke home screen dan aktifkan notifikasi untuk pengingat masak.</p>
            </div>
            <button onClick={() => setShowBanner(false)} className="rounded-full p-2 text-sand-400 hover:bg-sand-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {installPrompt && !isInstalled && (
              <Button size="sm" onClick={handleInstallClick} className="gap-2 bg-sage-600 hover:bg-sage-700 text-white">
                <Download className="h-4 w-4" /> Pasang Aplikasi
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={requestNotifications} className="gap-2">
              <Home className="h-4 w-4 text-sage-500" />
              {permissionState === 'granted' ? 'Notifikasi Aktif' : 'Aktifkan Notifikasi'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
