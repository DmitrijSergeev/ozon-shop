"use client";

import { AuthProvider } from "../hooks/useAuth";
import { ShopProvider } from "../hooks/useShop";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShopProvider>{children}</ShopProvider>
    </AuthProvider>
  );
}
