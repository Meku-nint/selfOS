const TOKEN_KEY = "token";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAuthToken(): string | null {
  if (!isBrowser()) return null;

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) return token;
  } catch {
    // Ignore storage access errors
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${TOKEN_KEY}=`));

  return cookieMatch ? decodeURIComponent(cookieMatch.split("=")[1] ?? "") : null;
}

export function setAuthToken(token: string): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=2592000; samesite=lax`;
}

export function clearAuthToken(): void {
  if (!isBrowser()) return;

  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}
