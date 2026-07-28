import { ApiErrorResponse, ApiResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const AUTH_PATHS = [
  "/auth/signin",
  "/auth/signup",
  "/auth/refresh",
  "/auth/signout",
];

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  fallbackErrorMessage?: string;
  responseType?: "data" | "envelope";
  _retried?: boolean;
};

const shouldAttemptRefresh = (path: string, retried?: boolean) =>
  !retried && !AUTH_PATHS.some((authPath) => path.startsWith(authPath));

const refreshAccessToken = async () => {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  return response.ok;
};

async function executeFetch<TData>(
  path: string,
  options: ApiFetchOptions,
): Promise<TData | ApiResponse<TData>> {
  const {
    body,
    fallbackErrorMessage = "Request failed",
    headers,
    responseType = "data",
    _retried = false,
    ...init
  } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: init.credentials ?? "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && shouldAttemptRefresh(path, _retried)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return executeFetch(path, { ...options, _retried: true });
  }

  const json = (await response.json().catch(() => null)) as
    | ApiResponse<TData>
    | ApiErrorResponse
    | null;

  if (!response.ok || !json)
    throw new Error(json?.message ?? fallbackErrorMessage);

  if (responseType === "envelope") return json as ApiResponse<TData>;

  if (json.success === false)
    throw new Error(json.message ?? fallbackErrorMessage);

  return json.data as TData;
}

export async function apiFetch<TData>(
  path: string,
  options?: ApiFetchOptions & { responseType?: "data" },
): Promise<TData>;

export async function apiFetch<TData>(
  path: string,
  options: ApiFetchOptions & { responseType: "envelope" },
): Promise<ApiResponse<TData>>;

export async function apiFetch<TData>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TData | ApiResponse<TData>> {
  return executeFetch<TData>(path, options);
}
