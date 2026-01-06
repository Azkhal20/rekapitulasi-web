"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication on mount and route change
    const checkAuth = () => {
      const authenticated = isAuthenticated();

      // If not authenticated and trying to access protected route
      if (!authenticated && pathname !== "/") {
        router.replace("/");
      }
    };

    checkAuth();

    // Set up interval to check session expiration every minute
    const interval = setInterval(() => {
      if (!isAuthenticated() && pathname !== "/") {
        router.replace("/");
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [pathname, router]);

  return <>{children}</>;
}
