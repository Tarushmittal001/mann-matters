"use client";

import { useEffect, useState } from "react";
import {
  CLINIC_TZ,
  CLINIC_TZ_LABEL,
  clinicNow,
  deviceZone,
  formatTime,
  offsetFromClinic,
  offsetLabel,
} from "@/lib/clinic-time";

/**
 * Timezone clarity, stated once at the top of the portal instead of implied on
 * every row. The clinic runs on IST and every time in here is IST; if the
 * device is on another clock we say so, with the gap, rather than letting the
 * practitioner discover it by missing a session.
 */
export default function TimezoneNote({ profileTimezone, initialTime }: { profileTimezone: string; initialTime: string }) {
  const [time, setTime] = useState(initialTime);
  const [zone, setZone] = useState<string | null>(null);

  useEffect(() => {
    setZone(deviceZone());
    const tick = () => setTime(clinicNow().time);
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const offset = zone ? offsetFromClinic(zone) : 0;
  const mismatch = Boolean(zone && offset !== 0);
  const profileMismatch = profileTimezone !== CLINIC_TZ;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.82rem] text-ink/65">
      <span className="inline-flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          aria-hidden="true"
          className="text-forest-600"
        >
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 7.4V12l3.2 2" />
        </svg>
        <span>
          All times are <strong className="font-semibold text-forest-900">clinic time</strong> —{" "}
          {CLINIC_TZ_LABEL}, {CLINIC_TZ}. It is{" "}
          <strong className="font-semibold tabular-nums text-forest-900">{formatTime(time)}</strong>{" "}
          there now.
        </span>
      </span>

      {mismatch && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-haldi/[0.14] px-2.5 py-0.5 font-medium text-haldi-ink ring-1 ring-inset ring-haldi/30">
          Your device is on {zone} ({offsetLabel(offset)})
        </span>
      )}

      {profileMismatch && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-800/[0.05] px-2.5 py-0.5 font-medium text-ink/70 ring-1 ring-inset ring-forest-800/10">
          Profile timezone: {profileTimezone}
        </span>
      )}
    </div>
  );
}
