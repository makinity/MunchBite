"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ShoppingBag, CreditCard, ChefHat, Sparkles } from "lucide-react";

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: string;
  linkHref?: string;
  duration?: number;
}

interface RealtimeToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function getToastIcon(type?: string) {
  switch (type) {
    case "order_created":
      return <ShoppingBag size={18} className="text-white" />;
    case "payment_success":
      return <CreditCard size={18} className="text-white" />;
    case "status_change":
      return <ChefHat size={18} className="text-white" />;
    default:
      return <Sparkles size={18} className="text-white" />;
  }
}

export default function RealtimeToast({ toasts, onDismiss }: RealtimeToastProps) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      onDismiss(latest.id);
    }, latest.duration || 6000);

    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-chocolate/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/15 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 transition-all hover:scale-[1.02]"
        >
          <div className="w-9 h-9 rounded-xl bg-peach flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            {getToastIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-extrabold text-xs text-peach tracking-wide">
              {toast.title}
            </h4>
            <p className="text-xs text-white/90 leading-snug">
              {toast.message}
            </p>
            {toast.linkHref && (
              <Link
                href={toast.linkHref}
                onClick={() => onDismiss(toast.id)}
                className="inline-block text-[11px] font-bold text-peach underline pt-1 hover:text-white transition-colors"
              >
                View details →
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Dismiss toast"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
