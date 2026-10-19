-- The overnight hold on notifications is gone, so the three columns that
-- configured it have nothing left reading them. Dropping settings columns
-- loses only the preference, never a client record.
ALTER TABLE "ExpertProfile" DROP COLUMN "quietHoursEnabled",
DROP COLUMN "quietHoursStart",
DROP COLUMN "quietHoursEnd";
