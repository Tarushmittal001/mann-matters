-- A practice plan needs more than "what": an exercise without how often and
-- for how long is advice, not something somebody can actually follow.
ALTER TABLE "Homework" ADD COLUMN "frequency" TEXT NOT NULL DEFAULT '',
ADD COLUMN "duration" TEXT NOT NULL DEFAULT '';
