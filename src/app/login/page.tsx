"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChefHat,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FieldErrors {
  name?: string;
  contact_number?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/order";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    contact_number: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setGlobalError("");
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (mode === "register") {
      if (!form.name.trim()) {
        errors.name = "Full name is required.";
      }
      if (!form.contact_number.trim()) {
        errors.contact_number = "Contact number is required.";
      } else if (!/^(09|\+639)\d{9}$/.test(form.contact_number.replace(/\s+/g, ""))) {
        errors.contact_number = "Please enter a valid Philippine mobile number (e.g. 09123456789).";
      }
      if (form.password !== form.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    if (!form.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (mode === "register" && form.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setGlobalError("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (authError) {
          setGlobalError(
            authError.message.toLowerCase().includes("invalid")
              ? "Incorrect email or password. Please try again."
              : authError.message
          );
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } else {
        // Register new customer
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.name.trim(),
              contact_number: form.contact_number.trim(),
              address: form.address.trim(),
            },
          },
        });

        if (signUpError) {
          setGlobalError(signUpError.message);
          return;
        }

        // If user created, save customer profile record
        if (authData.user) {
          await supabase.from("customers").insert({
            user_id: authData.user.id,
            name: form.name.trim(),
            email: form.email.trim(),
            contact_number: form.contact_number.trim(),
            address: form.address.trim() || null,
          });
        }

        // If email confirmation is required by Supabase:
        if (authData.session) {
          router.push(redirectTo);
          router.refresh();
        } else {
          setSuccessMessage(
            "Account created successfully! Please check your email inbox to confirm your account."
          );
        }
      }
    } catch {
      setGlobalError("Something went wrong. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    "w-full py-2.5 rounded-xl border-2 bg-cream text-chocolate placeholder:text-chocolate/30 text-sm font-medium focus:outline-none transition-colors duration-200 disabled:opacity-60";

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Bar */}
      <header className="w-full px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          aria-label="Back to MunchBite Home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-peach text-white">
            <ChefHat size={16} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-extrabold text-chocolate tracking-tight">
              MunchBite
            </span>
            <span className="text-[10px] font-semibold text-peach tracking-wide">
              Sweet Bites, Big Smiles.
            </span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Decorative Glows */}
          <div
            aria-hidden="true"
            className="fixed -top-20 -left-20 w-64 h-64 rounded-full bg-soft-pink opacity-40 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="fixed -bottom-20 -right-20 w-64 h-64 rounded-full bg-peach opacity-20 blur-3xl pointer-events-none"
          />

          {/* Auth Card */}
          <div className="relative bg-white rounded-3xl shadow-xl px-8 py-9 flex flex-col gap-5">
            {/* Logo / Header */}
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl" aria-hidden="true">
                🍪
              </span>
              <h1 className="text-2xl font-extrabold text-chocolate">
                {mode === "login" ? "Welcome Back!" : "Create an Account"}
              </h1>
              <p className="text-sm text-chocolate/60 font-medium">
                {mode === "login"
                  ? "Sign in to place and track your pastry orders"
                  : "Join MunchBite to easily order fresh treats"}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-cream p-1 rounded-2xl border border-soft-pink/60">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setGlobalError("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  mode === "login"
                    ? "bg-white text-chocolate shadow-sm"
                    : "text-chocolate/60 hover:text-chocolate"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setGlobalError("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  mode === "register"
                    ? "bg-white text-chocolate shadow-sm"
                    : "text-chocolate/60 hover:text-chocolate"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Global Error Banner */}
            {globalError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3"
              >
                <AlertCircle
                  size={16}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs font-semibold text-red-700">{globalError}</p>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-200 px-4 py-3"
              >
                <CheckCircle2
                  size={16}
                  className="text-green-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs font-semibold text-green-700">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
              {mode === "register" && (
                <>
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="name"
                      className="text-xs font-bold text-chocolate"
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User
                        size={15}
                        aria-hidden="true"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chocolate/40"
                      />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Juan Dela Cruz"
                        value={form.name}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`${inputBase} pl-9 pr-3.5 ${
                          fieldErrors.name
                            ? "border-red-400"
                            : "border-soft-pink focus:border-peach"
                        }`}
                      />
                    </div>
                    {fieldErrors.name && (
                      <p className="text-[11px] font-semibold text-red-500">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="contact_number"
                      className="text-xs font-bold text-chocolate"
                    >
                      Contact Number *
                    </label>
                    <div className="relative">
                      <Phone
                        size={15}
                        aria-hidden="true"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chocolate/40"
                      />
                      <input
                        id="contact_number"
                        name="contact_number"
                        type="tel"
                        autoComplete="tel"
                        required
                        placeholder="09171234567"
                        value={form.contact_number}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`${inputBase} pl-9 pr-3.5 ${
                          fieldErrors.contact_number
                            ? "border-red-400"
                            : "border-soft-pink focus:border-peach"
                        }`}
                      />
                    </div>
                    {fieldErrors.contact_number && (
                      <p className="text-[11px] font-semibold text-red-500">
                        {fieldErrors.contact_number}
                      </p>
                    )}
                  </div>

                  {/* Delivery Address */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="address"
                      className="text-xs font-bold text-chocolate"
                    >
                      Default Delivery Address (Optional)
                    </label>
                    <div className="relative">
                      <MapPin
                        size={15}
                        aria-hidden="true"
                        className="absolute left-3.5 top-3 text-chocolate/40"
                      />
                      <textarea
                        id="address"
                        name="address"
                        rows={2}
                        placeholder="House / Unit / Street, Barangay, City"
                        value={form.address}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`${inputBase} pl-9 pr-3.5 resize-none`}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-xs font-bold text-chocolate">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chocolate/40"
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
                    className={`${inputBase} pl-9 pr-3.5 ${
                      fieldErrors.email
                        ? "border-red-400"
                        : "border-soft-pink focus:border-peach"
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] font-semibold text-red-500">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-chocolate"
                >
                  Password *
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chocolate/40"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    placeholder={
                      mode === "register"
                        ? "At least 6 characters"
                        : "Enter password"
                    }
                    value={form.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`${inputBase} pl-9 pr-10 ${
                      fieldErrors.password
                        ? "border-red-400"
                        : "border-soft-pink focus:border-peach"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-chocolate/40 hover:text-chocolate transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] font-semibold text-red-500">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password (Register mode only) */}
              {mode === "register" && (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-bold text-chocolate"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chocolate/40"
                    />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`${inputBase} pl-9 pr-3.5 ${
                        fieldErrors.confirmPassword
                          ? "border-red-400"
                          : "border-soft-pink focus:border-peach"
                      }`}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[11px] font-semibold text-red-500">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full mt-3 py-3 px-6 rounded-full
                  bg-peach text-white font-bold text-sm
                  shadow-md hover:shadow-lg
                  hover:bg-opacity-90 active:scale-95
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {mode === "login" ? "Signing In…" : "Creating Account…"}
                  </>
                ) : mode === "login" ? (
                  "Log In & Continue"
                ) : (
                  "Create Account & Continue"
                )}
              </button>
            </form>
          </div>

          {/* Footer Back Link */}
          <p className="text-center text-xs text-chocolate/40 font-medium mt-5">
            <Link href="/" className="hover:text-peach transition-colors">
              ← Back to MunchBite
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-peach border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
