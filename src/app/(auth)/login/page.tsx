'use client';

import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Leaf } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, router, user]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Selamat datang kembali!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Gagal login. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
      toast.success('Berhasil masuk dengan Google!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Gagal masuk dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl shadow-sand-900/5 bg-white/80 backdrop-blur-xl rounded-[2rem]">
        <CardHeader className="space-y-3 text-center pb-6 pt-8">
          <div className="mx-auto bg-sage-100 p-3 rounded-full w-fit">
            <Leaf className="w-8 h-8 text-sage-900" />
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">Rumah Flow</CardTitle>
          <CardDescription className="text-sand-900/70 text-base">
            Temukan kembali ritme tenang Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8 px-8">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sand-900">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="bunda@rumahflow.com" 
                className="rounded-xl border-sand-100 focus-visible:ring-sage-500 bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sand-900">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="rounded-xl border-sand-100 focus-visible:ring-sage-500 bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-xl bg-sage-500 hover:bg-sage-900 text-white transition-colors h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-sand-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-sand-500 font-medium">Atau lanjutkan dengan</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full rounded-xl h-12 text-base border-sand-100 text-foreground hover:bg-sand-50"
            onClick={handleGoogleLogin}
          >
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}