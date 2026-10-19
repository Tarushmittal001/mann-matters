-- Data only; no schema change.
--
-- Practitioners used to save their introduction, languages, focus areas and
-- years of practice to "ExpertProfile", which nothing public read, while the
-- site showed the admin-made "Expert" row. Those fields now live on "Expert"
-- and the portal writes there. Carry across what a practitioner wrote, where
-- they saved their profile more recently than the listing was last edited, so
-- their own words are what goes live. Empty values never overwrite.
UPDATE "Expert" AS e SET
  "bio"             = CASE WHEN p."bio" <> ''          THEN p."bio"             ELSE e."bio" END,
  "languages"       = CASE WHEN p."languages" <> '[]'  THEN p."languages"       ELSE e."languages" END,
  "specialties"     = CASE WHEN p."specialties" <> '[]' THEN p."specialties"    ELSE e."specialties" END,
  "experienceYears" = CASE WHEN p."experienceYears" > 0 THEN p."experienceYears" ELSE e."experienceYears" END
FROM "ExpertProfile" AS p
WHERE p."expertId" = e."slug"
  AND p."updatedAt" > e."updatedAt";
