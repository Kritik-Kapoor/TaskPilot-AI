-- Convert description from TEXT (HTML strings) to JSONB.
-- Existing HTML is preserved as JSON string values until the app stores TipTap JSON.
ALTER TABLE "Ticket"
ALTER COLUMN "description" SET DATA TYPE JSONB
USING (
  CASE
    WHEN "description" IS NULL THEN NULL
    ELSE to_jsonb("description")
  END
);
