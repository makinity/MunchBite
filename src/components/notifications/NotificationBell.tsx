"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  CreditCard,
  ChefHat,
  Sparkles,
  Package,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { playAdminOrderChime, playCustomerStatusChime } from "@/lib/sound";

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  role_target: "admin" | "customer" | "all";
  order_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  role?: "admin" | "customer";
  userId?: string | null;
  className?: string;
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getIconForType(type: string) {
  switch (type) {
    case "order_created":
      return <ShoppingBag size={16} className="text-peach" />;
    case "payment_success":
      return <CreditCard size={16} className="text-green-600" />;
    case "status_change":
      return <ChefHat size={16} className="text-amber-600" />;
    default:
      return <Sparkles size={16} className="text-peach" />;
  }
}

export default function NotificationBell({
  role = "customer",
  userId,
  className = "",
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?scope=${role}`);
      const result = await res.json();
      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  }, [role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time Supabase WebSockets listener
  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime-notifications-${role}-${userId || "global"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          const matches =
            role === "admin"
              ? newNotif.role_target === "admin" || newNotif.role_target === "all"
              : newNotif.role_target === "customer" ||
                newNotif.role_target === "all" ||
                (userId && newNotif.user_id === userId);

          if (matches) {
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            setUnreadCount((c) => c + 1);

            // Play Chime
            if (role === "admin") {
              playAdminOrderChime();
            } else {
              playCustomerStatusChime();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const updated = payload.new as NotificationItem;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          setUnreadCount(() => {
            const list = notifications.map((n) => (n.id === updated.id ? updated : n));
            return list.filter((n) => !n.is_read).length;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, userId, notifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isUpdating) return;
    setIsUpdating(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markAll: true,
          role_target: role,
          userId: userId || null,
        }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Non-blocking
    } finally {
      setIsUpdating(false);
    }
  };

  // Mark single as read
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
      } catch {
        // Non-blocking
      }
    }
    setIsOpen(false);
  };

  const displayedNotifications = activeTab === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* ── Notification Bell Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View Notifications"
        title="Notifications"
        className={`
          relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
          ${
            isOpen
              ? "bg-peach text-white shadow-md"
              : "bg-white/90 text-chocolate border border-soft-pink/60 hover:border-peach hover:bg-peach/10 shadow-sm"
          }
        `}
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-wiggle" : ""} />

        {/* Unread Pill Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-extrabold text-white bg-peach rounded-full ring-2 ring-white shadow-md animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification Panel Popover ── */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-cream/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-chocolate">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-peach text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={isUpdating}
                    className="flex items-center gap-1 text-[11px] font-bold text-chocolate/70 hover:text-peach transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
                  activeTab === "all"
                    ? "bg-chocolate text-white shadow-xs"
                    : "text-chocolate/60 hover:text-chocolate hover:bg-white"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unread")}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
                  activeTab === "unread"
                    ? "bg-chocolate text-white shadow-xs"
                    : "text-chocolate/60 hover:text-chocolate hover:bg-white"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center gap-2 text-gray-400">
                <Package size={36} className="text-gray-300" />
                <p className="text-xs font-bold text-gray-600">
                  {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                  Real-time order statuses and sweet updates will appear here instantly.
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const targetHref = role === "admin" ? "/admin/orders" : "/account";

                return (
                  <Link
                    key={n.id}
                    href={targetHref}
                    onClick={() => handleItemClick(n)}
                    className={`flex items-start gap-3.5 p-4 transition-colors hover:bg-cream/40 block ${
                      !n.is_read ? "bg-peach/8 font-semibold" : "opacity-85"
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-peach/15 flex items-center justify-center mt-0.5 shadow-xs">
                      {getIconForType(n.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-chocolate truncate">
                          {n.title}
                        </p>
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                          <Clock size={10} />
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-chocolate/75 line-clamp-2 leading-snug font-normal">
                        {n.message}
                      </p>
                    </div>

                    {!n.is_read && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-peach mt-2 ring-2 ring-white" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center">
            <Link
              href={role === "admin" ? "/admin/orders" : "/account"}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-peach hover:underline"
            >
              <span>{role === "admin" ? "Go to Orders Dashboard" : "View My Orders & Account"}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
