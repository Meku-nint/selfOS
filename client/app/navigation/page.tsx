"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthToken, getAuthToken } from "../lib/auth";

const NAV_ITEMS = [
	{ href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
	{ href: "/journal", label: "Journal", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
	{ href: "/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
	{ href: "/reminders", label: "Set reminder", badge: 3, icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
	{ href: "/todo", label: "To-do", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
	{ href: "/goals", label: "Goals", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
];

export default function AppNavbar() {
	const pathname = usePathname();
	const router = useRouter();
	const headerRef = useRef<HTMLElement | null>(null);
	const [open, setOpen] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const syncToken = () => setToken(getAuthToken());
		syncToken();

		const handleFocus = () => {
			syncToken();
		};

		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};

		window.addEventListener("focus", handleFocus);
		// Use passive event listener for scroll to improve performance
		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();

		return () => {
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("scroll", handleScroll);
		};
	}, [pathname]);

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: MouseEvent | TouchEvent) => {
			if (!headerRef.current) return;
			const target = event.target as Node;
			if (!headerRef.current.contains(target)) {
				setOpen(false);
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("touchstart", handlePointerDown, { passive: true });
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	const showNavbar = useMemo(() => {
		if (!token) return false;
		return pathname !== "/";
	}, [pathname, token]);

	const handleLogout = () => {
		clearAuthToken();
		setToken(null);
		setOpen(false);
		router.push("/");
	};

	if (!showNavbar) return null;

	return (
		<header
			ref={headerRef}
			className={`sticky top-0 z-50 transition-all duration-300 ${
				scrolled
					? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50"
					: "bg-white border-b border-slate-200/50"
			}`}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
				<Link href="/dashboard" className="flex items-center gap-2 group">
					<Image src="/logo.png" alt="selfOS logo" width={96} height={40} className="h-10 w-24 object-cover border  border-slate-200 rounded" priority />
				</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex md:items-center md:gap-1">
						{NAV_ITEMS.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
										isActive
											? "text-slate-900 bg-slate-100"
											: "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
									}`}
								>
									<svg
										className={`h-4 w-4 transition-colors ${
											isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
										}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={1.5}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
									</svg>
									<span>{item.label}</span>
									{item.badge ? (
										<span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-medium leading-5 text-white">
											{item.badge}
										</span>
									) : null}
									<svg
										className={`h-3.5 w-3.5 transition-colors ${
											isActive ? "text-slate-700" : "text-slate-400 group-hover:text-slate-700"
										}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
									</svg>
									{isActive && (
										<span className="absolute bottom-0 left-3 right-3 h-0.5 bg-slate-900 rounded-full" />
									)}
								</Link>
							);
						})}
					</nav>

					{/* Desktop Right Section */}
					<div className="hidden md:flex md:items-center md:gap-4">
						<div className="h-6 w-px bg-slate-200" />
						<button
							type="button"
							onClick={handleLogout}
							className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-light text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
						>
							<svg
								className="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={1.5}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							<span>Log out</span>
						</button>
					</div>

					{/* Mobile Menu Button */}
					<button
						aria-label="Toggle navigation"
						onClick={() => setOpen((s) => !s)}
						className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
					>
						{open ? (
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						) : (
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						)}
					</button>
				</div>
			</div>

			{/* Mobile Menu */}
			{open && (
				<div className="md:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-md">
					<div className="mx-auto max-w-7xl px-4 py-3">
						<div className="flex flex-col gap-1">
							{NAV_ITEMS.map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setOpen(false)}
										className={`group flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
											isActive
												? "bg-slate-100 text-slate-900"
												: "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
										}`}
									>
										<svg
											className={`h-5 w-5 ${isActive ? "text-slate-900" : "text-slate-400"}`}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={1.5}
										>
											<path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
										</svg>
										<span className="flex-1 font-medium">{item.label}</span>
										{item.badge ? (
											<span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-medium leading-5 text-white">
												{item.badge}
											</span>
										) : null}
										<svg
											className={`h-4 w-4 transition-colors ${
												isActive ? "text-slate-800" : "text-slate-400 group-hover:text-slate-700"
											}`}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={2}
										>
											<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
										</svg>
									</Link>
								);
							})}
							<div className="border-t border-slate-200/50 my-2" />
							<button
								type="button"
								onClick={handleLogout}
								className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
							>
								<svg
									className="h-5 w-5 text-slate-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={1.5}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								<span className="font-light">Log out</span>
							</button>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}