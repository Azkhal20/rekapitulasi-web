"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication on mount and route change
    const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (isAuthenticated() && pathname.startsWith("/dashboard")) {
          // Force logout for security
          import("@/lib/auth").then(({ clearUserSession }) => {
            clearUserSession();
            router.replace("/");
          });
        }
      }, IDLE_TIMEOUT);
    };

    const checkAuth = () => {
      const authenticated = isAuthenticated();

      // If not authenticated and trying to access dashboard routes, boot them out
      if (!authenticated) {
        if (pathname !== "/" && pathname.startsWith("/dashboard")) {
          router.replace("/");
        }
      } else {
        // Only start idle timer if authenticated
        resetIdleTimer();
      }
    };

    checkAuth();

    // Listeners for activity
    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Set up rapid check for session validity every 30 seconds
    const interval = setInterval(() => {
      if (!isAuthenticated() && pathname.startsWith("/dashboard")) {
        router.replace("/");
      }
    }, 30000); 

    return () => {
      clearInterval(interval);
      clearTimeout(idleTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [pathname, router]);

  return <>{children}</>;
}
