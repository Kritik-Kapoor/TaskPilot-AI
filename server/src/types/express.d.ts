declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        orgId: string | null;
      };
    }
  }
}

export {};
