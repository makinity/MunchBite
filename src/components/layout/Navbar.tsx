"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, ChefHat, User, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Menu", href: "/#best-sellers" },
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/#footer" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check auth & admin role
  useEffect(() => {
    async function checkAuthAndRole() {
      try {
        const res = await fetch("/api/auth/role");
        const data = await res.json();
        setIsLoggedIn(data.isLoggedIn);
        setIsAdmin(data.isAdmin);

        const supabase = createClient();
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async () => {
            const freshRes = await fetch("/api/auth/role");
            const freshData = await freshRes.json();
            setIsLoggedIn(freshData.isLoggedIn);
            setIsAdmin(freshData.isAdmin);
          }
        );

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    }
    checkAuthAndRole();
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-cream transition-shadow duration-300 ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="MunchBite Home"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-peach text-white">
                <ChefHat size={20} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-extrabold text-chocolate tracking-tight">
                  MunchBite
                </span>
                <span className="text-[10px] font-semibold text-peach tracking-wide hidden sm:block">
                  Sweet Bites, Big Smiles.
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <ul className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-chocolate hover:text-peach transition-colors duration-200 relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-peach rounded-full transition-all duration-200 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-chocolate px-3.5 py-2 rounded-full hover:bg-opacity-90 transition-all shadow-sm"
                >
                  <ShieldCheck size={14} className="text-peach" />
                  Admin Panel
                </Link>
              )}

              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="flex items-center gap-1.5 text-xs font-bold text-chocolate bg-white border border-soft-pink px-4 py-2 rounded-full hover:border-peach transition-colors shadow-sm"
                >
                  <User size={14} className="text-peach" />
                  My Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-bold text-chocolate/80 hover:text-peach px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
              )}

              <Button variant="primary" size="sm" href="/order">
                <ShoppingCart size={15} />
                Order Now
              </Button>
            </div>

            {/* Mobile: Actions + Hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-chocolate px-2.5 py-1.5 rounded-full"
                >
                  <ShieldCheck size={12} className="text-peach" />
                  Admin
                </Link>
              )}

              <Button
                variant="primary"
                size="sm"
                href="/order"
                className="text-xs px-3 py-2"
              >
                <ShoppingCart size={14} />
                Order
              </Button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-chocolate hover:bg-soft-pink transition-colors duration-200"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-cream border-t border-soft-pink px-4 pb-6 pt-4 flex flex-col gap-4">
            {/* Nav Links */}
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-chocolate hover:bg-soft-pink hover:text-chocolate transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Customer Account / Admin Panel */}
            <div className="pt-2 border-t border-soft-pink flex flex-col gap-2">
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-chocolate"
                >
                  <ShieldCheck size={15} className="text-peach" />
                  Go to Admin Panel
                </Link>
              )}

              {isLoggedIn ? (
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-chocolate bg-white border border-soft-pink"
                >
                  <User size={15} className="text-peach" />
                  My Account & Orders
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="text-center py-2 text-xs font-bold text-chocolate/80 hover:text-peach"
                >
                  Sign In to Account
                </Link>
              )}

              <Button
                variant="primary"
                size="md"
                href="/order"
                className="w-full justify-center"
              >
                <ShoppingCart size={16} />
                Order Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16 lg:h-20" />
    </>
  );
}
