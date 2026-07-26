import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ApiResponse } from "../utils/apiResponse.js";

export const validate =
  (schema: ZodType, source: "body" | "params" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return new ApiResponse(
        400,
        null,
        result.error.issues[0]?.message ?? "Invalid request body",
      ).send(res);
    }

    req.validated = {
      ...req.validated,
      [source]: result.data,
    };

    next();
  };
