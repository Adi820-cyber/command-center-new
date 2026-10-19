import { ErrorEnvelopeSchema, MutationResponseSchema } from "@orbit/contracts";
import { getCurrentSession } from "../../lib/auth";
export async function request<T>(
  path: string,
  schema: { parse(value: unknown): T },
  body?: unknown,
): Promise<T> {
  const session = await getCurrentSession();
  if (!session) {
    window.location.assign("/login");
    throw new Error("Please sign in.");
  }
  const configuredBase = path.startsWith('/api/control/')
    ? import.meta.env.VITE_CONTROL_API_BASE_URL
    : path.startsWith('/api/identity/')
      ? import.meta.env.VITE_IDENTITY_API_BASE_URL
      : import.meta.env.VITE_API_BASE_URL;
  const base = configuredBase?.trim().replace(/\/+$/, "");
  if (!base) throw new Error("The API address is not configured.");
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.location.assign("/login");
    const error = ErrorEnvelopeSchema.safeParse(result);
    throw new Error(
      error.success
        ? error.data.error.message
        : "The request could not complete.",
    );
  }
  return schema.parse(result);
}
export const mutate = (path: string, body: unknown) =>
  request(path, MutationResponseSchema, body);
