"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Target,
  NotebookPen,
  BellRing,
  ChartColumnIncreasing,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-50 via-white to-red-50/30 text-stone-900">
      <header
        className={`fixed inset-x-0 top-0 z-30 border-b transition-all duration-200 ${
          isScrolled
            ? "border-red-900 bg-red-950/95 shadow-sm backdrop-blur-xl"
            : "border-red-900 bg-red-950 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
            <Image
              src="/logo.png"
              alt="selfOS logo"
              width={96}
              height={40}
              className="h-10 w-24 rounded-lg border border-stone-200 bg-white object-cover"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-medium text-red-100 transition-colors hover:text-white">
              Features
            </a>
            <a href="#contact" className="text-sm font-medium text-red-100 transition-colors hover:text-white">
              Contact
            </a>
            <Link href="/login" className="text-sm font-medium text-red-100 transition-colors hover:text-white">
              Login
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-950 transition-colors hover:bg-red-50"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-800 bg-red-900 text-red-50 transition-colors hover:bg-red-800 md:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" strokeWidth={1.8} /> : <Menu className="h-5 w-5" strokeWidth={1.8} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-red-900 bg-red-950 px-4 pb-4 md:hidden">
            <div className="flex flex-col gap-2 pt-3">
              <a
                href="#features"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-900 hover:text-white"
              >
                Features
              </a>
              <a
                href="#contact"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-900 hover:text-white"
              >
                Contact
              </a>
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-900 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/login"
                onClick={closeMenu}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-950 transition-colors hover:bg-red-50"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative overflow-hidden pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-red-100/50 blur-3xl" />
          <div className="absolute left-0 top-72 h-72 w-72 rounded-full bg-stone-100/70 blur-3xl" />
        </div>

        <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-red-700 sm:text-sm">
            Your personal productivity OS
              </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
Your personal operating system for focus and progress.              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
                selfOS brings tasks, goals, reminders, journaling, and progress analytics into one calm workflow designed
                for consistency.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
                >
                  Start now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Explore features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-600">Tasks</span>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-600">Goals</span>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-600">Journal</span>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-600">Analytics</span>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Today snapshot</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-stone-700">Tasks completed</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">7</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-stone-700">Top priorities</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">3</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <NotebookPen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-stone-700">Journal streak</span>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">12 days</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <BellRing className="h-5 w-5 text-rose-600" />
              <h3 className="mt-3 text-sm font-semibold text-stone-900">Smart reminders that keep your day on track.</h3>
              <p className="mt-1 text-sm text-stone-600">Never miss important actions with simple, timely nudges.</p>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <Target className="h-5 w-5 text-amber-600" />
              <h3 className="mt-3 text-sm font-semibold text-stone-900">Goal tracking</h3>
              <p className="mt-1 text-sm text-stone-600">Break big goals into small wins you can finish every day.</p>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <NotebookPen className="h-5 w-5 text-blue-600" />
              <h3 className="mt-3 text-sm font-semibold text-stone-900">Daily journal</h3>
              <p className="mt-1 text-sm text-stone-600">Capture thoughts, energy, and progress in one place.</p>
            </article>
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <ChartColumnIncreasing className="h-5 w-5 text-emerald-600" />
              <h3 className="mt-3 text-sm font-semibold text-stone-900">Progress analytics</h3>
              <p className="mt-1 text-sm text-stone-600">See trends that help you improve your focus over time.</p>
            </article>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Private, personal, focused
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">Start running your life with SelfOS.</h2>
                <p className="mt-2 text-sm text-stone-600">Start using selfOS and turn your plans into consistent progress.</p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}