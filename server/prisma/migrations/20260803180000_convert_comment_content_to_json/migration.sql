-- Convert comment content from TEXT to JSONB (TipTap doc).
-- Existing plain-text comments are wrapped as a single-paragraph TipTap document.
ALTER TABLE "Comment"
ALTER COLUMN "content" SET DATA TYPE JSONB
USING (
  jsonb_build_object(
    'type',
    'doc',
    'content',
    CASE
      WHEN trim("content") = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(
        jsonb_build_object(
          'type',
          'paragraph',
          'content',
          jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', "content")
          )
        )
      )
    END
  )
);
