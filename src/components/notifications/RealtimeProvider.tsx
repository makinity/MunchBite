"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { playAdminOrderChime, playCustomerStatusChime } from "@/lib/sound";
import RealtimeToast, { ToastMessage } from "./RealtimeToast";

interface RealtimeContextType {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  isAdmin: boolean;
  userId: string | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]); // Keep last 4 max
  }, []);

  // Check auth & role
  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/role");
        const data = await res.json();
        setIsAdmin(Boolean(data.isAdmin));

        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        setUserId(sessionData?.session?.user?.id || null);
      } catch {
        // Non-blocking
      }
    }
    loadAuth();
  }, []);

  // Supabase Realtime Subscription for Notifications & Orders
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("global-app-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new as {
            id: string;
            role_target: string;
            user_id?: string;
            title: string;
            message: string;
            type: string;
            order_id?: string;
          };

          const isTargetedAdmin = isAdmin && (notif.role_target === "admin" || notif.role_target === "all");
          const isTargetedCustomer = !isAdmin && (
            notif.role_target === "customer" ||
            notif.role_target === "all" ||
            (userId && notif.user_id === userId)
          );

          if (isTargetedAdmin || isTargetedCustomer) {
            showToast({
              title: notif.title,
              message: notif.message,
              type: notif.type,
              linkHref: isTargetedAdmin ? "/admin/orders" : "/account",
            });

            if (isTargetedAdmin) {
              playAdminOrderChime();
            } else {
              playCustomerStatusChime();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, userId, showToast]);

  return (
    <RealtimeContext.Provider value={{ showToast, isAdmin, userId }}>
      {children}
      <RealtimeToast toasts={toasts} onDismiss={dismissToast} />
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
