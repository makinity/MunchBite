"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Cookie,
  Star,
  Users,
  LogOut,
  ChefHat,
  X,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/notifications/NotificationBell";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: ShoppingBag,     label: "Orders",    href: "/admin/orders" },
  { icon: Cookie,          label: "Products",  href: "/admin/products" },
  { icon: Star,            label: "Reviews",   href: "/admin/reviews" },
  { icon: Users,           label: "Customers", href: "/admin/customers" },
];

// Page title map
const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders":    "Orders",
  "/admin/products":  "Products",
  "/admin/reviews":   "Reviews",
  "/admin/customers": "Customers",
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  isCollapsed,
  isMobileOpen,
  onClose,
}: {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${isCollapsed ? "justify-center px-0" : ""}`}>
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-peach text-white shadow-sm">
          <ChefHat size={18} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-base font-extrabold text-white truncate">MunchBite</span>
            <span className="text-[10px] font-semibold text-white/40">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={isCollapsed ? label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm
                transition-all duration-150 group relative
                ${active
                  ? "bg-peach text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
                }
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>{label}</span>}

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-chocolate text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm
            text-white/60 hover:bg-red-500/20 hover:text-red-400
            transition-all duration-150 group relative
            ${isCollapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-chocolate text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0 bg-chocolate
          transition-[width] duration-300 ease-in-out
          h-screen sticky top-0 overflow-hidden
          ${isCollapsed ? "w-[68px]" : "w-60"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/50 z-40 lg:hidden
          transition-opacity duration-300
          ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* ── Mobile Drawer ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-chocolate z-50 lg:hidden flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Mobile admin navigation"
      >
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({
  isCollapsed,
  onToggleCollapse,
  onOpenMobile,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sm:px-6 gap-4 flex-shrink-0">

      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation"
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <h1 className="text-base font-extrabold text-chocolate">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <NotificationBell role="admin" />
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-peach flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0">
            A
          </div>
          <span className="hidden sm:block text-xs font-semibold text-chocolate">Admin</span>
        </div>
      </div>
    </header>
  );
}

// ─── Admin Shell Layout ───────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored !== null) setIsCollapsed(stored === "true");
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  // ── Login page: render children only (full-page layout) ──────────────────
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          onOpenMobile={() => setIsMobileOpen(true)}
        />

        {/* ── Slot ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
