"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChefHat, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FieldErrors {
  email?: string;
  password?: string;
}

// ─── Shake animation injected once ───────────────────────────────────────────
const shakeStyle = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    15%       { transform: translateX(-6px); }
    30%       { transform: translateX(6px); }
    45%       { transform: translateX(-4px); }
    60%       { transform: translateX(4px); }
    75%       { transform: translateX(-2px); }
    90%       { transform: translateX(2px); }
  }
  .shake { animation: shake 0.5s ease-in-out; }
`;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Shake the card on failed submit
  const [shaking, setShaking] = useState(false);
  // Failed attempt counter for progressive feedback
  const [attempts, setAttempts] = useState(0);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGlobalError("");
  };

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      errors.password = "Password is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      triggerShake();
      return;
    }

    setIsLoading(true);
    setGlobalError("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (authError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        triggerShake();

        // Progressive error messages
        if (newAttempts >= 3) {
          setGlobalError("Still having trouble? Double-check your email and password carefully.");
        } else {
          setGlobalError("Incorrect email or password. Please try again.");
        }

        // Highlight the password field specifically
        setFieldErrors({ password: " " }); // space = show red border without duplicate text
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      triggerShake();
      setGlobalError("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full py-3 rounded-xl border-2 bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none transition-colors duration-200 disabled:opacity-60";

  return (
    <>
      {/* Inject shake keyframes once */}
      <style>{shakeStyle}</style>

      <div className="min-h-screen bg-cream flex flex-col">

        {/* Top Bar */}
        <header className="w-full px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Back to MunchBite Home">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-peach text-white">
              <ChefHat size={16} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-chocolate tracking-tight">MunchBite</span>
              <span className="text-[10px] font-semibold text-peach tracking-wide">Sweet Bites, Big Smiles.</span>
            </div>
          </Link>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">

            {/* Decorative blobs */}
            <div aria-hidden="true" className="fixed -top-20 -left-20 w-64 h-64 rounded-full bg-soft-pink opacity-40 blur-3xl pointer-events-none" />
            <div aria-hidden="true" className="fixed -bottom-20 -right-20 w-64 h-64 rounded-full bg-peach opacity-20 blur-3xl pointer-events-none" />

            {/* Card */}
            <div className={`relative bg-white rounded-3xl shadow-xl px-8 py-10 flex flex-col gap-6 ${shaking ? "shake" : ""}`}>

              {/* Header */}
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-3xl" aria-hidden="true">🍪</span>
                <h1 className="text-2xl font-extrabold text-chocolate">Welcome Back!</h1>
                <p className="text-sm text-chocolate/60 font-medium">
                  Sign in to the MunchBite Admin Panel
                </p>
              </div>

              {/* Global Error Banner */}
              {globalError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3"
                >
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-700">{globalError}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-chocolate">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      aria-hidden="true"
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                        fieldErrors.email ? "text-red-400" : "text-chocolate/40"
                      }`}
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={`${inputBase} pl-10 pr-4 ${
                        fieldErrors.email
                          ? "border-red-400 focus:border-red-400"
                          : "border-soft-pink focus:border-peach"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p id="email-error" role="alert" className="text-xs font-semibold text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-chocolate">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      aria-hidden="true"
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                        fieldErrors.password ? "text-red-400" : "text-chocolate/40"
                      }`}
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.password?.trim()}
                      aria-describedby={fieldErrors.password?.trim() ? "password-error" : undefined}
                      className={`${inputBase} pl-10 pr-11 ${
                        fieldErrors.password
                          ? "border-red-400 focus:border-red-400"
                          : "border-soft-pink focus:border-peach"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-chocolate/40 hover:text-chocolate transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password?.trim() && (
                    <p id="password-error" role="alert" className="text-xs font-semibold text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full mt-2 py-3.5 px-6 rounded-full
                    bg-peach text-white font-bold text-base
                    shadow-md hover:shadow-lg
                    hover:bg-opacity-90 active:scale-95
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                    transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>
            </div>

            {/* Back to home */}
            <p className="text-center text-xs text-chocolate/40 font-medium mt-6">
              <Link href="/" className="hover:text-peach transition-colors">
                ← Back to MunchBite
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-peach border-t-transparent animate-spin" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
