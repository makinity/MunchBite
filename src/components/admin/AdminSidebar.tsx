"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Cookie,
  Star,
  Users,
  LogOut,
  ChefHat,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminSidebarProps {
  isOpen: boolean;          // mobile overlay open
  isCollapsed: boolean;     // desktop collapsed to icons only
  onClose: () => void;      // close mobile overlay
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/admin" },
  { icon: ShoppingBag,     label: "Orders",     href: "/admin/orders" },
  { icon: Cookie,          label: "Products",   href: "/admin/products" },
  { icon: Star,            label: "Reviews",    href: "/admin/reviews" },
  { icon: Users,           label: "Customers",  href: "/admin/customers" },
];

export default function AdminSidebar({ isOpen, isCollapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${isCollapsed ? "justify-center" : ""}`}>
        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-peach text-white">
          <ChefHat size={18} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-base font-extrabold text-white truncate">MunchBite</span>
            <span className="text-[10px] font-semibold text-white/40 truncate">Admin Panel</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1" aria-label="Admin navigation">
        {navItems.map(({ icon: Icon, label, href }) => {
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

              {/* Tooltip on collapsed */}
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-chocolate text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
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
            <span className="absolute left-full ml-2 px-2 py-1 bg-chocolate text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0 bg-chocolate
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-16" : "w-60"}
          min-h-screen sticky top-0 h-screen
        `}
      >
        {sidebarContent}
      </aside>

      {/* ── MOBILE OVERLAY ──────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/50 z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-chocolate z-50 lg:hidden
          transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Mobile admin navigation"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
