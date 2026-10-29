import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SignInFailure = "invalid_credentials" | "unavailable";

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: SignInFailure; message?: string };

export interface AuthSession {
  access_token: string;
  token_type?: string;
  user: {
    id: string;
    email: string;
    user_metadata: Record<string, any>;
  };
}

export class AuthConfigurationError extends Error {
  constructor() {
    super("Command Center authentication is not configured.");
    this.name = "AuthConfigurationError";
  }
}

const SESSION_STORAGE_KEY = "orbit_mysql_session";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  try {
    supabaseClient = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
    return supabaseClient;
  } catch {
    return null;
  }
}

function apiBaseUrl(): string {
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return isLocal ? "http://localhost:3000" : "https://cmd-api.vercel.app";
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: AuthSession | null): void {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent("orbit_auth_changed", { detail: session }));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("orbit_auth_changed", { detail: null }));
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (session?.access_token) return session;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const mapped: AuthSession = {
          access_token: data.session.access_token,
          token_type: data.session.token_type || "bearer",
          user: {
            id: data.session.user.id,
            email: data.session.user.email || "",
            user_metadata: (data.session.user.user_metadata as Record<string, any>) || {},
          },
        };
        saveStoredSession(mapped);
        return mapped;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const trimmedEmail = email.trim();
  const supabase = getSupabaseClient();

  // 1. Try Supabase Auth if configured in environment
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!error && data.session && data.user) {
        saveStoredSession({
          access_token: data.session.access_token,
          token_type: data.session.token_type || "bearer",
          user: {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            user_metadata: (data.user.user_metadata as Record<string, any>) || {},
          },
        });
        return { ok: true };
      }

      if (error && (error.status === 400 || error.message?.toLowerCase().includes("invalid login credentials"))) {
        // Continue to check MySQL auth endpoint as secondary before rejecting
      }
    } catch {
      // Continue to MySQL endpoint
    }
  }

  // 2. Try MySQL / Backend Auth endpoint (/api/auth/login)
  try {
    const res = await fetch(`${apiBaseUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, password }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.access_token && data.user) {
        saveStoredSession(data as AuthSession);
        return { ok: true };
      }
    }

    if (res.status === 401 || res.status === 400) {
      let detailMsg: string | undefined;
      try {
        const data = await res.json();
        if (
          data?.error?.message &&
          !data.error.message.includes("does not exist") &&
          !data.error.message.includes("internal error")
        ) {
          detailMsg = data.error.message;
        }
      } catch {}
      return {
        ok: false,
        reason: "invalid_credentials",
        message: detailMsg || "We couldn't sign you in with those credentials. Check your email and password.",
      };
    }
  } catch {
    // API endpoint unreachable
  }

  return {
    ok: false,
    reason: "invalid_credentials",
    message: "We couldn't sign you in with those credentials. Check your email and password.",
  };
}

export async function signOut(): Promise<void> {
  try {
    const session = getStoredSession();
    if (session?.access_token) {
      await fetch(`${apiBaseUrl()}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
  } finally {
    saveStoredSession(null);
  }
}

/** Calls `onEnded` when the session is signed out elsewhere. */
export async function onSessionEnded(onEnded: () => void) {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<AuthSession | null>;
    if (!custom.detail) {
      onEnded();
    }
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === SESSION_STORAGE_KEY && !e.newValue) {
      onEnded();
    }
  };
  window.addEventListener("orbit_auth_changed", handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener("orbit_auth_changed", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export async function getAuthClient() {
  const supabase = getSupabaseClient();
  if (supabase) {
    return supabase;
  }

  return {
    auth: {
      async getSession() {
        const session = await getCurrentSession();
        return { data: { session }, error: null };
      },
      async signOut() {
        await signOut();
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const res = await signInWithPassword(email, password);
        if (res.ok) {
          const session = await getCurrentSession();
          return { data: { session, user: session?.user }, error: null };
        }
        return {
          data: { session: null, user: null },
          error: {
            message: (res as any).message || "Invalid email or password.",
            status: 400,
          },
        };
      },
      async signUp({ email, password }: { email: string; password: string }) {
        const res = await signInWithPassword(email, password);
        if (res.ok) {
          const session = await getCurrentSession();
          return { data: { session, user: session?.user }, error: null };
        }
        return {
          data: { session: null, user: null },
          error: { message: "Account already registered or user exists", status: 422 },
        };
      },
      async updateUser(params: { password?: string; data?: Record<string, any> }) {
        const session = getStoredSession();
        if (!session?.access_token) throw new Error("No active session");

        if (params.password) {
          const res = await fetch(`${apiBaseUrl()}/api/auth/change-password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ password: params.password }),
          });
          if (!res.ok) return { error: new Error("Failed to change password") };
        }

        if (params.data) {
          const res = await fetch(`${apiBaseUrl()}/api/auth/update-profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(params.data),
          });
          if (!res.ok) return { error: new Error("Failed to update profile") };

          session.user.user_metadata = {
            ...session.user.user_metadata,
            ...params.data,
          };
          saveStoredSession(session);
        }

        return { error: null };
      },
      onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
        const handler = (e: Event) => {
          const custom = e as CustomEvent<AuthSession | null>;
          callback(custom.detail ? "SIGNED_IN" : "SIGNED_OUT", custom.detail);
        };
        window.addEventListener("orbit_auth_changed", handler);
        return {
          data: {
            subscription: {
              unsubscribe: () => window.removeEventListener("orbit_auth_changed", handler),
            },
          },
        };
      },
    },
  };
}
