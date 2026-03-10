"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const demoImages = [
    {
      src: "/demo-screen-1.svg",
      alt: "SelfOS dashboard preview",
    },
    {
      src: "/demo-screen-2.svg",
      alt: "SelfOS workflow preview",
    },
  ];
  const testimonials = [
    {
      quote: "SelfOS helped me stay consistent with my goals.",
      author: "Mia Carter",
      role: "Frontend Developer",
    },
    {
      quote: "I finally have one calm place for tasks, reminders, and journal notes.",
      author: "Alex Turner",
      role: "Product Designer",
    },
    {
      quote: "The daily flow keeps me focused without feeling overwhelmed.",
      author: "Noah Brooks",
      role: "Startup Founder",
    },
  ];

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % demoImages.length);
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [demoImages.length]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function goToPreviousSlide() {
    setCurrentSlide((prev) => (prev === 0 ? demoImages.length - 1 : prev - 1));
  }

  function goToNextSlide() {
    setCurrentSlide((prev) => (prev + 1) % demoImages.length);
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
              src="/selfos-logo.svg"
              alt="selfOS logo"
              width={220}
              height={72}
              className="h-10 w-auto max-w-44 object-contain"
              priority
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
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 "
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
             
          <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className="text-2xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl lg:text-6xl"
    >
      Your personal operating system for focus and progress.
    </motion.h1>
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

            <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Product demo</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousSlide}
                    aria-label="Previous demo image"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:bg-stone-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextSlide}
                    aria-label="Next demo image"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:bg-stone-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-2">
                <div
                  className="flex gap-4 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(calc(-${currentSlide} * (100% + 1rem)))` }}
                >
                  {demoImages.map((image) => (
                    <div key={image.src} className="min-w-full overflow-hidden rounded-lg bg-white">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={1200}
                        height={760}
                        className="h-60 w-full object-cover sm:h-70"
                        priority
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                {demoImages.map((image, index) => (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to demo image ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      currentSlide === index ? "w-6 bg-stone-900" : "w-2.5 bg-stone-300 hover:bg-stone-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-linear-to-br from-rose-50 via-white to-amber-50 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-rose-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-amber-200/35 blur-3xl" />

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Core features</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  Everything you need to stay focused and finish what matters
                </h2>
              </div>
              <p className="max-w-md text-sm text-stone-600">
                Built for people who want clarity, consistency, and momentum in one simple workflow.
              </p>
            </div>

            <div className="relative mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="group rounded-2xl border border-rose-100 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 transition-colors group-hover:bg-rose-600 group-hover:text-white">
                    <BellRing className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-rose-400">01</span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug text-stone-900">Smart reminders</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Timely nudges that keep your day moving without becoming noise.
                </p>
              </article>

              <article className="group rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <Target className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-amber-500">02</span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug text-stone-900">Goal tracking</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Turn big ambitions into daily, achievable actions with clear progress.
                </p>
              </article>

              <article className="group rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <NotebookPen className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-blue-500">03</span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug text-stone-900">Daily journal</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Reflect quickly, capture ideas, and build a stronger personal system.
                </p>
              </article>

              <article className="group rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <ChartColumnIncreasing className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-emerald-500">04</span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-snug text-stone-900">Progress analytics</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  Visual trends show where you are winning and where to improve next.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-stone-200 bg-white/95 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Social proof</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                  Trusted by productive people worldwide
                </h2>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.author}
                  className="rounded-2xl border border-stone-200 bg-linear-to-b from-white to-stone-50 p-5 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${item.author}-${index}`} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-stone-700">&quot;{item.quote}&quot;</p>
                  <p className="mt-4 text-sm font-semibold text-stone-900">{item.author}</p>
                  <p className="text-xs text-stone-500">{item.role}</p>
                </article>
              ))}
            </div>
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