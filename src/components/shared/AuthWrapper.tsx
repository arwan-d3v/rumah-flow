'use client';

import { useAuthListener } from "@/hooks/useAuthListener";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  useAuthListener();
  return <>{children}</>;
}