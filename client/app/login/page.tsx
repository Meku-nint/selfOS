"use client";

import React, { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { getAuthToken, setAuthToken } from "../lib/auth";

function normalizeBaseUrl(rawUrl: string | undefined, fallbackUrl: string, protocol: "http" | "https" = "https") {
  const value = (rawUrl || "").trim();
  const fallback = (fallbackUrl || "").trim();
  const resolved = value || fallback;

  if (!resolved) return "";

  const withProtocol = /^https?:\/\//i.test(resolved)
    ? resolved
    : `${protocol}://${resolved}`;

  return withProtocol.replace(/\/+$/, "");
}

const API_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000", "https");
type View = "login" | "register" | "verify";
const inputClassName = "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 transition-all focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200";
const primaryButtonClassName = "w-full rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50";
const labelClassName = "mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const nextParam = searchParams.get("next");

  const [view, setView] = useState<View>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function getSafeNextPath(path: string | null) {
    if (!path) return "/dashboard";
    if (!path.startsWith("/")) return "/dashboard";
    if (path.startsWith("//")) return "/dashboard";
    return path;
  }

  function persistAuthToken(token: string) {
    setAuthToken(token);
  }

  useEffect(() => {
    const redirectPath = getSafeNextPath(nextParam);
    const cookieToken = getAuthToken();

    if (tokenParam) {
      persistAuthToken(tokenParam);
      router.replace(redirectPath);
      return;
    }

    if (cookieToken) {
      router.replace(redirectPath);
      return;
    }

    if (errorParam === "google_auth_failed") {
      setError("Google sign-in failed. Please try again.");
    }
  }, [router, tokenParam, errorParam, nextParam]);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      const data = res.data;
      if (data.token) {
        persistAuthToken(data.token);
      }
      router.replace(getSafeNextPath(nextParam));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        firstName: registerFirstName,
        lastName: registerLastName,
        email: registerEmail,
        password: registerPassword,
      });
      setOtp("");
      setSuccess("OTP sent to your email. Enter it to verify.");
      setView("verify");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        email: registerEmail,
        otp,
      });
      setSuccess("Your account is verified. You can now sign in.");
      setView("login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    resetMessages();

    if (!registerEmail) {
      setError("Enter your email in registration before resending OTP.");
      setView("register");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email: registerEmail });
      setSuccess("A new OTP has been sent to your email.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-linear-to-br from-stone-50 via-white to-stone-100/40 px-3 py-3 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-stone-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-stone-200/30 blur-3xl" />
      </div>

        <div className="w-4/7 max-w-md mx-auto">
          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xl sm:p-8">
            <div className="mb-4 text-center sm:mb-6">
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900">selfOS</h1>
              <p className="mt-2 text-sm text-stone-500">
                {view === "verify"
                  ? "Enter the verification code sent to your email"
                  : view === "register"
                  ? "Create your account to get started"
                  : "Sign in to continue your journey"}
              </p>
            </div>

            {/* Messages */}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </p>
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="flex items-center gap-2 text-sm text-rose-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Login Form */}
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                <div>
                  <label className={labelClassName}>Email address</label>
                  <input
                    required
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={inputClassName}
                    placeholder="alex.rahman@gmail.com"
                  />
                </div>

                <div>
                  <label className={labelClassName}>Password</label>
                  <input
                    required
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="Your password"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button type="button" className="text-xs text-stone-500 transition-colors hover:text-stone-800">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className={primaryButtonClassName}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <a
                  href={`${API_URL}/auth/google`}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-700 transition-all hover:border-stone-400 hover:bg-stone-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm font-semibold">Continue with Google</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setView("register");
                  }}
                  className="mt-3 w-full text-sm text-stone-600 transition-colors hover:text-stone-900"
                >
                  Don&apos;t have an account? <span className="font-semibold">Create account</span>
                </button>
              </form>
            )}

            {/* Register Form */}
            {view === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>First name</label>
                    <input
                      required
                      type="text"
                      value={registerFirstName}
                      onChange={(e) => setRegisterFirstName(e.target.value)}
                      className={inputClassName}
                      placeholder="Alex"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Last name</label>
                    <input
                      required
                      type="text"
                      value={registerLastName}
                      onChange={(e) => setRegisterLastName(e.target.value)}
                      className={inputClassName}
                      placeholder="Rahman"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClassName}>Email address</label>
                  <input
                    required
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className={inputClassName}
                    placeholder="alex.rahman@gmail.com"
                  />
                </div>

                <div>
                  <label className={labelClassName}>Password</label>
                  <input
                    required
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className={inputClassName}
                    placeholder="At least 8 characters"
                  />
                  <p className="mt-2 text-xs text-stone-500">Minimum 8 characters with at least one number and one letter</p>
                </div>

                <button type="submit" disabled={loading} className={`${primaryButtonClassName} mt-2`}>
                  {loading ? "Creating account..." : "Create account"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setView("login");
                  }}
                  className="w-full text-sm text-stone-600 transition-colors hover:text-stone-900"
                >
                  Already have an account? <span className="font-semibold">Sign in</span>
                </button>
              </form>
            )}

            {/* Verify OTP Form */}
            {view === "verify" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="mb-3 block text-center text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Verification code
                  </label>
                  <input
                    required
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-4 text-center font-mono text-2xl tracking-[0.45em] text-stone-900 transition-all focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="6-digit code"
                    maxLength={6}
                  />
                  <p className="mt-4 text-center text-sm text-stone-500">
                    We&apos;ve sent a 6-digit code to<br />
                    <span className="font-semibold text-stone-700">{registerEmail}</span>
                  </p>
                </div>

                <button type="submit" disabled={loading} className={primaryButtonClassName}>
                  {loading ? "Verifying..." : "Verify email"}
                </button>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="text-stone-500 transition-colors hover:text-stone-900"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-semibold text-stone-700 transition-colors hover:text-stone-900"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>

      </div>
    </div>
  );
}