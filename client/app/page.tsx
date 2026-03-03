"use client";

import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen bg-linear-to-b from-red-50/10 to-red-50/20">
      <header
        className={`fixed top-0 inset-x-0 z-25 transition-transform duration-200 will-change-transform border-b-2 border-red-200 ${
          isScrolled
            ? "bg-white/90 shadow-md backdrop-blur-md translate-y-0"
            : "bg-transparent shadow-none backdrop-blur-0 translate-y-0"
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-16 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
            <Image src="/logo.png" alt="selfOS logo" width={36} height={36} className="h-9 w-9 rounded-xl object-cover bg-white border border-red-200/50 shadow-sm" />
            <span className={`text-2xl sm:text-3xl font-light tracking-tight transition-colors duration-200 ${
              isScrolled ? "text-red-950" : "text-red-950"
            }`}>selfOS</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-6 text-sm sm:text-base">
            <a href="#contact" className={`hidden md:inline transition-colors duration-200 ${
              isScrolled ? "text-red-900/70 hover:text-red-600" : "text-red-900/70 hover:text-red-600"
            }`}>Contact Us</a>
            <Link
              href="/login"
              className={`px-4 sm:px-6 py-2 rounded-md bg-red-950 text-white font-medium hover:bg-red-900 transition-colors tracking-wide ${
                isScrolled ? "shadow-sm" : ""
              }`}
            >
              Get Started
            </Link>
            <Link href="/login" className={`hidden md:inline font-medium transition-colors duration-200 ${
              isScrolled ? "text-red-900/70 hover:text-red-600" : "text-red-900/70 hover:text-red-600"
            }`}>
              Login
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md border ml-2 transition-colors duration-200 ${
              isScrolled 
                ? "border-red-200 bg-white text-red-950" 
                : "border-red-200 bg-white text-red-950"
            }`}
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-red-100/50 bg-white/95 backdrop-blur-md px-4 pb-4">
            <div className="flex flex-col gap-3 pt-3">
              <a
                href="#contact"
                onClick={closeMenu}
                className="px-3 py-2 rounded-md text-red-900/70 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Contact Us
              </a>
              <Link
                href="/login"
                onClick={closeMenu}
                className="px-3 py-2 rounded-md border border-red-200 text-red-950 text-center font-medium hover:bg-red-50 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="px-4 sm:px-8 lg:px-16 pt-32 pb-20 relative z-0">
        <section className="max-w-4xl mx-auto text-center">
          <p className="inline-flex px-4 py-1.5 rounded-full text-xs sm:text-sm bg-white/70 border border-red-200/50 text-red-700 mb-6 tracking-wide">
            Your personal productivity OS
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-red-950">
            Clarity, focus, and progress in one place.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-red-900/60 max-w-2xl mx-auto font-light">
            selfOS helps you manage tasks, reminders, goals, journaling, and analytics so you can plan better and move faster.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3 rounded-md bg-red-950 text-white font-medium hover:bg-red-900 transition-colors tracking-wide"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 rounded-md border border-red-200 bg-white/50 text-red-950 font-medium hover:bg-red-50 transition-colors tracking-wide"
            >
              Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}