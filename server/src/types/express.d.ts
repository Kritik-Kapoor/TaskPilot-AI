declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        orgId: string | null;
      };
      validated?: Partial<{
        body: unknown;
        params: unknown;
        query: unknown;
      }>;
    }
  }
}

export {};
