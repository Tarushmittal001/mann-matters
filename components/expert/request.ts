/** One place where the portal talks to its API, so error handling is uniform. */
export type SendResult<T = Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; data: T | null };

export async function send<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<SendResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const error =
        (data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error
          : null) ?? "Something went wrong at our end. Please try again.";
      return { ok: false, error, status: res.status, data };
    }

    return { ok: true, data: (data ?? ({} as T)) as T };
  } catch {
    return {
      ok: false,
      error: "We could not reach the server. Check your connection and try again.",
      status: 0,
      data: null,
    };
  }
}

/** "3:42 pm" — the stamp forms show after a successful save. */
export function stampNow() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}
