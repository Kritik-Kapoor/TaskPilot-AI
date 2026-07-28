import type { CookieOptions, Response } from "express";

export const AUTH_COOKIE_NAME = "taskpilot";
export const REFRESH_COOKIE_NAME = "taskpilot_refresh";

const ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function getAuthCookieOptions(
  overrides: CookieOptions = {},
): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";

  const options: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    ...overrides,
  };

  if (isProduction) {
    options.domain = process.env.COOKIE_DOMAIN ?? ".kritikkapoor.in";
  }

  return options;
}

export function setAuthCookie(res: Response, token: string) {
  return res.cookie(
    AUTH_COOKIE_NAME,
    token,
    getAuthCookieOptions({
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    }),
  );
}

export function setRefreshCookie(res: Response, token: string) {
  return res.cookie(
    REFRESH_COOKIE_NAME,
    token,
    getAuthCookieOptions({
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    }),
  );
}

export function clearAuthCookie(res: Response) {
  return res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
}

export function clearRefreshCookie(res: Response) {
  return res.clearCookie(REFRESH_COOKIE_NAME, getAuthCookieOptions());
}

export function clearAuthCookies(res: Response) {
  clearAuthCookie(res);
  clearRefreshCookie(res);
}
