import { z } from "zod";

const validateDescriptionLength = (value: string, ctx: z.RefinementCtx) => {
  if (!value) {
    return;
  }

  if (value.length < 20) {
    ctx.addIssue({
      code: "custom",
      message: "Description must be at least 20 characters long",
    });
  }

  if (value.length > 500) {
    ctx.addIssue({
      code: "custom",
      message: "Description must be less than 500 characters long",
    });
  }
};

export const optionalDescriptionSchema = z
  .string()
  .trim()
  .superRefine(validateDescriptionLength)
  .transform((value) => value || undefined);

export const updateDescriptionSchema = z
  .string()
  .trim()
  .superRefine(validateDescriptionLength)
  .transform((value) => (value ? value : null));
