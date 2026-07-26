import { z } from "zod";

export const optionalDescriptionField = z.string().trim().superRefine((value, ctx) => {
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
});
