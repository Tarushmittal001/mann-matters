-- Date of birth replaces the typed age: it decides whether a guardian must
-- consent, so it has to be a fact that does not go stale. "age" stays for
-- accounts that have not added a date of birth yet.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateOfBirth" DATE;
