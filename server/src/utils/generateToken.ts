import { createHash, randomBytes, randomInt } from "crypto";
import type { Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { setAuthCookie, setRefreshCookie } from "./authCookie.js";

export interface AccessTokenPayload {
  userId: string;
  orgId: string | null;
}

interface RefreshTokenPayload {
  userId: string;
  type: "refresh";
}

const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET!;

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      "15m") as SignOptions["expiresIn"],
  });

export const signRefreshToken = (userId: string) =>
  jwt.sign(
    { userId, type: "refresh" } satisfies RefreshTokenPayload,
    getRefreshSecret(),
    {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
        "7d") as SignOptions["expiresIn"],
    },
  );

export const issueAuthTokens = (res: Response, payload: AccessTokenPayload) => {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload.userId);

  setAuthCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
};

export const verifyRefreshToken = (
  token: string,
): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload;

    if (decoded.type !== "refresh" || typeof decoded.userId !== "string") {
      return null;
    }

    return {
      userId: decoded.userId,
      type: "refresh",
    };
  } catch {
    return null;
  }
};

export const generateRandomToken = () => {
  return randomBytes(32).toString("hex");
};

export const generateOtp = (length = 6): string => {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, "0");
};

export const generateHashedToken = (rawToken: string) => {
  return createHash("sha256").update(rawToken).digest("hex");
};
