-- AlterTable
ALTER TABLE "Expert" ADD COLUMN     "profession" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "registrationNo" TEXT NOT NULL DEFAULT '';

-- Backfill: until now the profession was guessed from the credential line on
-- every read. Write that guess down once, so an admin can see it and correct
-- it, and so nothing reads the credential line for it again. Same rules as
-- `guessProfession()` in lib/professions.ts: a medical qualification (MBBS,
-- MD or M.D., DNB, DPM, MRCPsych — but not M.D.Sc or MDS) makes a
-- psychiatrist; otherwise "clinical", then "counselling", then psychologist.
UPDATE "Expert" SET "profession" = CASE
  WHEN "credentials" ~* '(^|[^a-z])(mbbs|m\.? ?d|dnb|dpm|mrcpsych)(?![.]?[a-z])' THEN 'PSYCHIATRIST'
  WHEN "credentials" ~* 'clinical' THEN 'CLINICAL_PSYCHOLOGIST'
  WHEN "credentials" ~* 'counsell?ing' THEN 'COUNSELLING_PSYCHOLOGIST'
  ELSE 'PSYCHOLOGIST'
END
WHERE "profession" = '';
