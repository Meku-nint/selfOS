"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/todo", label: "Tasks" },
    { href: "/journal", label: "Journal" },
    { href: "/reminders", label: "Reminders" },
    { href: "/goals", label: "Goals" },
    { href: "/analytics", label: "Analytics" },
  ];

  const resourceLinks = [
    { href: "/about", label: "About us" },
    { href: "/blog", label: "Blog & updates" },
    { href: "/careers", label: "Careers", badge: "We're hiring" },
    { href: "/press", label: "Press kit" },
    { href: "/help", label: "Help center" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/security", label: "Security" },
    { href: "/cookies", label: "Cookies" },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriptionStatus("loading");

    setTimeout(() => {
      setSubscriptionStatus("success");
      setEmail("");
      setTimeout(() => setSubscriptionStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900">
                <span className="text-base font-semibold text-white">s</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-stone-900">selfOS</span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-stone-600">
              Your personal operating system for clarity, focus, and progress.
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-900">Subscribe for product updates</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  required
                />
                <button
                  type="submit"
                  disabled={subscriptionStatus === "loading"}
                  className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {subscriptionStatus === "loading" ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : subscriptionStatus === "success" ? (
                    "Subscribed"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
              {subscriptionStatus === "success" && (
                <p className="text-xs text-emerald-700">Thanks for subscribing! Check your inbox.</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href="https://twitter.com/selfos"
                className="rounded-md border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/selfos"
                className="rounded-md border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://github.com/selfos"
                className="rounded-md border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://discord.gg/selfos"
                className="rounded-md border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                aria-label="Discord"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515c-.21.374-.456.88-.625 1.282a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.63-1.282 19.738 19.738 0 0 0-4.886 1.515c-2.594 3.988-3.294 7.874-2.93 11.655a20.068 20.068 0 0 0 6.137 2.968c.508-.701 1.096-1.643 1.425-2.39a13.12 13.12 0 0 1-2.226-1.07c.188-.14.372-.286.55-.44 4.137 2.007 9.12 2.007 13.192 0 .18.154.364.3.55.44-.707.442-1.456.817-2.226 1.07.33.747.917 1.689 1.426 2.39a20.02 20.02 0 0 0 6.136-2.968c.424-4.304-.67-8.15-2.93-11.655zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Product</h3>
                <ul className="space-y-3">
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`text-sm transition-colors ${
                          pathname === link.href ? "font-medium text-stone-900" : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Resources</h3>
                <ul className="space-y-3">
                  {resourceLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-stone-900">
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="ml-2 rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Legal</h3>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-stone-600 transition-colors hover:text-stone-900">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <h4 className="mb-3 text-xs font-medium text-stone-900">Support</h4>
                  <div className="space-y-2">
                    <a href="mailto:support@selfos.com" className="text-sm text-stone-600 transition-colors hover:text-stone-900">
                      support@selfos.com
                    </a>
                    <p className="text-xs text-stone-500">Response time: &lt; 24h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-stone-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-xs text-stone-500">© {currentYear} selfOS. All rights reserved.</p>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link href="/privacy" className="text-stone-500 transition-colors hover:text-stone-900">
                Privacy
              </Link>
              <span className="text-stone-300">•</span>
              <Link href="/terms" className="text-stone-500 transition-colors hover:text-stone-900">
                Terms
              </Link>
              <span className="text-stone-300">•</span>
              <Link href="/cookies" className="text-stone-500 transition-colors hover:text-stone-900">
                Cookies
              </Link>
              <span className="text-stone-300">•</span>
              <Link href="/sitemap" className="text-stone-500 transition-colors hover:text-stone-900">
                Sitemap
              </Link>
            </div>

            <select
              className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600 hover:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-300"
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
