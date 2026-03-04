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
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/todo", label: "Tasks", icon: "✓" },
    { href: "/journal", label: "Journal", icon: "📔" },
    { href: "/reminders", label: "Reminders", icon: "🔔" },
    { href: "/goals", label: "Goals", icon: "🎯" },
    { href: "/analytics", label: "Analytics", icon: "📈" },
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
    
    // Simulate API call
    setTimeout(() => {
      setSubscriptionStatus("success");
      setEmail("");
      setTimeout(() => setSubscriptionStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <footer className="relative border-t border-red-100 bg-gradient-to-b from-white to-red-50/30">
      {/* Decorative top wave */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column - Enhanced */}
          <div className="space-y-6 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <span className="text-white text-lg font-bold">s</span>
                <div className="absolute -inset-0.5 rounded-xl bg-red-900/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-red-950 group-hover:text-red-800 transition-colors">
                selfOS
              </span>
            </Link>
            
            <p className="text-sm text-red-900/80 leading-relaxed max-w-sm">
              Your personal operating system for clarity, focus, and progress. 
              Join thousands of intentional livers building better habits.
            </p>
            
            {/* Newsletter Signup - New */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-950">Subscribe to insights</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 rounded-lg border border-red-200 bg-white/80 px-3 py-2 text-sm text-red-950 placeholder:text-red-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  required
                />
                <button
                  type="submit"
                  disabled={subscriptionStatus === "loading"}
                  className="rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-800 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscriptionStatus === "loading" ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : subscriptionStatus === "success" ? (
                    "✓ Sent"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
              {subscriptionStatus === "success" && (
                <p className="text-xs text-green-600 animate-fade-in">
                  Thanks for subscribing! Check your inbox.
                </p>
              )}
            </div>

            {/* Social Links - Enhanced */}
            <div className="flex gap-3 pt-2">
              <a 
                href="https://twitter.com/selfos" 
                className="rounded-lg bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100 hover:scale-110 hover:text-red-700"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a 
                href="https://linkedin.com/company/selfos" 
                className="rounded-lg bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100 hover:scale-110 hover:text-red-700"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a 
                href="https://github.com/selfos" 
                className="rounded-lg bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100 hover:scale-110 hover:text-red-700"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://discord.gg/selfos" 
                className="rounded-lg bg-red-50 p-2 text-red-600 transition-all hover:bg-red-100 hover:scale-110 hover:text-red-700"
                aria-label="Discord"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515c-.21.374-.456.88-.625 1.282a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.63-1.282 19.738 19.738 0 0 0-4.886 1.515c-2.594 3.988-3.294 7.874-2.93 11.655a20.068 20.068 0 0 0 6.137 2.968c.508-.701 1.096-1.643 1.425-2.39a13.12 13.12 0 0 1-2.226-1.07c.188-.14.372-.286.55-.44 4.137 2.007 9.12 2.007 13.192 0 .18.154.364.3.55.44-.707.442-1.456.817-2.226 1.07.33.747.917 1.689 1.426 2.39a20.02 20.02 0 0 0 6.136-2.968c.424-4.304-.67-8.15-2.93-11.655zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns - Enhanced */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {/* Product Links */}
              <div>
                <h3 className="text-sm font-semibold text-red-950 tracking-wide uppercase mb-4 flex items-center gap-2">
                  <span className="h-4 w-0.5 bg-red-400 rounded-full" />
                  Product
                </h3>
                <ul className="space-y-3">
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className={`group flex items-center gap-2 text-sm text-red-900/80 hover:text-red-700 transition-all ${
                          pathname === link.href ? 'text-red-700 font-medium' : ''
                        }`}
                      >
                        <span className="text-base opacity-0 group-hover:opacity-100 transition-opacity -ml-4">
                          →
                        </span>
                        <span>{link.label}</span>
                        {link.icon && (
                          <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                            {link.icon}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h3 className="text-sm font-semibold text-red-950 tracking-wide uppercase mb-4 flex items-center gap-2">
                  <span className="h-4 w-0.5 bg-red-400 rounded-full" />
                  Resources
                </h3>
                <ul className="space-y-3">
                  {resourceLinks.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="group flex items-center gap-2 text-sm text-red-900/80 hover:text-red-700 transition-all"
                      >
                        <span className="text-base opacity-0 group-hover:opacity-100 transition-opacity -ml-4">
                          →
                        </span>
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal & Support */}
              <div>
                <h3 className="text-sm font-semibold text-red-950 tracking-wide uppercase mb-4 flex items-center gap-2">
                  <span className="h-4 w-0.5 bg-red-400 rounded-full" />
                  Legal
                </h3>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="group flex items-center gap-2 text-sm text-red-900/80 hover:text-red-700 transition-all"
                      >
                        <span className="text-base opacity-0 group-hover:opacity-100 transition-opacity -ml-4">
                          →
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Support section */}
                <div className="mt-6">
                  <h4 className="text-xs font-medium text-red-950 mb-3">Support</h4>
                  <div className="space-y-2">
                    <a 
                      href="mailto:support@selfos.com" 
                      className="flex items-center gap-2 text-sm text-red-900/80 hover:text-red-700 transition-colors"
                    >
                      <span className="text-base">📧</span>
                      support@selfos.com
                    </a>
                    <p className="text-xs text-red-900/60">
                      Response time: &lt; 24h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="mt-16 pt-8 border-t border-red-200">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-xs text-red-900/70">
              © {currentYear} selfOS. Built with ❤️ for intentional living.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link href="/privacy" className="text-red-900/70 hover:text-red-700 transition-colors">
                Privacy
              </Link>
              <span className="text-red-300">•</span>
              <Link href="/terms" className="text-red-900/70 hover:text-red-700 transition-colors">
                Terms
              </Link>
              <span className="text-red-300">•</span>
              <Link href="/cookies" className="text-red-900/70 hover:text-red-700 transition-colors">
                Cookies
              </Link>
              <span className="text-red-300">•</span>
              <Link href="/sitemap" className="text-red-900/70 hover:text-red-700 transition-colors">
                Sitemap
              </Link>
            </div>

            {/* Language selector - Optional enhancement */}
            <select 
              className="text-xs bg-transparent border border-red-200 rounded px-2 py-1 text-red-900/70 hover:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[10px] text-red-900/50">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              SSL Secured
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              GDPR Compliant
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              SOC2 Type II
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </footer>
  );
}