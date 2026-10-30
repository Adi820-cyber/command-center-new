import { ErrorEnvelopeSchema, MutationResponseSchema } from "@orbit/contracts";
import { getCurrentSession, saveStoredSession } from "../../lib/auth";

function resolveApiBase(path: string): string {
  const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const mainBase = (import.meta.env.VITE_API_BASE_URL?.trim() || (isLocal ? "http://localhost:3000" : "https://cmd-api.vercel.app")).replace(/\/+$/, "");

  if (!isLocal) {
    if (path.startsWith("/api/control/") && import.meta.env.VITE_CONTROL_API_BASE_URL?.trim()) {
      return import.meta.env.VITE_CONTROL_API_BASE_URL.trim().replace(/\/+$/, "");
    }
    if (path.startsWith("/api/identity/") && import.meta.env.VITE_IDENTITY_API_BASE_URL?.trim()) {
      return import.meta.env.VITE_IDENTITY_API_BASE_URL.trim().replace(/\/+$/, "");
    }
  }
  return mainBase;
}

export async function request<T>(
  path: string,
  schema: { parse(value: unknown): T },
  body?: unknown,
): Promise<T> {
  const session = await getCurrentSession();
  if (!session) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
    throw new Error("Please sign in.");
  }
  const base = resolveApiBase(path);
  if (!base) throw new Error("The API address is not configured.");

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
  } catch (netErr) {
    throw new Error(
      `Could not reach API server at ${base}: ${netErr instanceof Error ? netErr.message : "Network connection failed"}.`,
      { cause: netErr },
    );
  }

  const rawText = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(rawText);
  } catch {
    result = undefined;
  }

  if (!response.ok) {
    if (response.status === 401) {
      saveStoredSession(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login?reason=session_expired");
      }
      throw new Error("Session expired or unauthorized (401). Please sign in again.");
    }

    if (result && typeof result === "object") {
      const error = ErrorEnvelopeSchema.safeParse(result);
      if (error.success && error.data.error.message) {
        throw new Error(error.data.error.message);
      }
    }

    if (rawText.includes("Protected by Vercel Authentication") || rawText.includes("sso-api")) {
      throw new Error(
        "The backend API is protected by Vercel Authentication. Please disable Deployment Protection on the API project in Vercel.",
      );
    }

    if (rawText.trim() && rawText.length < 200 && !rawText.includes("<html")) {
      throw new Error(`API Error (${response.status}): ${rawText.trim()}`);
    }

    throw new Error(`Server returned error status ${response.status} (${response.statusText || "Request failed"}).`);
  }

  if (result === undefined) {
    if (rawText.includes("Protected by Vercel Authentication") || rawText.includes("sso-api")) {
      throw new Error(
        "The backend API is protected by Vercel Authentication. Please disable Deployment Protection on the API project in Vercel.",
      );
    }
    throw new Error("Received an invalid response format from the server (expected JSON).");
  }

  return schema.parse(result);
}
export const mutate = (path: string, body: unknown) =>
  request(path, MutationResponseSchema, body);

export async function publicRequest<T>(
  path: string,
  schema: { parse(value: unknown): T },
  body?: unknown,
): Promise<T> {
  const base = resolveApiBase(path);
  if (!base) throw new Error("The API address is not configured.");

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
  } catch (netErr) {
    throw new Error(
      `Could not reach API server at ${base}: ${netErr instanceof Error ? netErr.message : "Network connection failed"}.`,
      { cause: netErr },
    );
  }

  const rawText = await response.text();
  let result: unknown;
  try {
    result = JSON.parse(rawText);
  } catch {
    result = undefined;
  }

  if (!response.ok) {
    if (result && typeof result === "object") {
      const error = ErrorEnvelopeSchema.safeParse(result);
      if (error.success && error.data.error.message) {
        throw new Error(error.data.error.message);
      }
    }
    if (rawText.trim() && rawText.length < 200 && !rawText.includes("<html")) {
      throw new Error(`API Error (${response.status}): ${rawText.trim()}`);
    }
    throw new Error(`Server returned error status ${response.status} (${response.statusText || "Request failed"}).`);
  }

  if (result === undefined) {
    throw new Error("Received an invalid response format from the server (expected JSON).");
  }

  return schema.parse(result);
}
