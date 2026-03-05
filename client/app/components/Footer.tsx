"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-b border-stone-200 pb-10">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/selfos-logo.svg"
              alt="selfOS logo"
              width={220}
              height={72}
              className="h-10 w-auto min-w-40 object-contain bg-red-950  rounded"
            />
          </Link>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
            Your personal operating system for clarity, focus, and progress.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href="https://twitter.com/selfos"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-100"
            >
              Twitter
            </a>
            <a
              href="https://github.com/selfos"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-100"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/company/selfos"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-100"
            >
              LinkedIn
            </a>
            <a
              href="https://t.me/selfos"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-100"
            >
              Telegram
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-b border-stone-200 py-10 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Product</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li><Link href="/dashboard" className="hover:text-stone-900">Features</Link></li>
              <li><Link href="/navigation" className="hover:text-stone-900">How it works</Link></li>
              <li><Link href="/dashboard" className="hover:text-stone-900">Pricing</Link></li>
              <li><Link href="/goals" className="hover:text-stone-900">Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-900">Resources</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li><Link href="/blog" className="hover:text-stone-900">Blog</Link></li>
              <li><Link href="/blog" className="hover:text-stone-900">Updates</Link></li>
              <li><Link href="/help" className="hover:text-stone-900">Guides</Link></li>
              <li><Link href="/help" className="hover:text-stone-900">Help center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-stone-900">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li><Link href="/about" className="hover:text-stone-900">About</Link></li>
              <li><Link href="/careers" className="hover:text-stone-900">Careers</Link></li>
              <li><Link href="/press" className="hover:text-stone-900">Press</Link></li>
              <li><Link href="#contact" className="hover:text-stone-900">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-b border-stone-200 py-10">
          <p className="text-base font-semibold text-stone-900">Build better systems.</p>
          <form onSubmit={handleNewsletterSubmit} className="mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-700 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
            <Link href="/privacy" className="hover:text-stone-900">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900">Terms</Link>
            <Link href="/security" className="hover:text-stone-900">Security</Link>
            <Link href="/cookies" className="hover:text-stone-900">Cookies</Link>
          </div>
          <p className="text-sm text-stone-500">© 2026 selfOS</p>
        </div>
      </div>
    </footer>
  );
}
