"use client";

import { useState } from "react";
import { ActionButton } from "@/components/expert/controls";

type Statement = {
  month: string;
  monthName: string;
  lines: {
    ref: string;
    date: string;
    time: string;
    client: string;
    service: string;
    collected: number;
    earned: number;
    platform: number;
    free: boolean;
  }[];
  totals: { sessions: number; collected: number; earned: number; platform: number };
};

/**
 * The statement as a file, built in the browser from the rows already on the
 * page. No endpoint: a second place the figures come from is a second set of
 * figures to disagree with the first.
 */
export default function StatementCsv({ statement, who }: { statement: Statement; who: string }) {
  const [done, setDone] = useState(false);

  function download() {
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Reference", "Date", "Time", "Client", "Session", "Collected", "Emoraa", "You"].map(cell).join(","),
      ...statement.lines.map((l) =>
        [l.ref, l.date, l.time, l.client, l.service + (l.free ? " (free)" : ""), l.collected, l.platform, l.earned]
          .map(cell)
          .join(",")
      ),
      ["Total", "", "", "", `${statement.totals.sessions} sessions`, statement.totals.collected, statement.totals.platform, statement.totals.earned]
        .map(cell)
        .join(","),
    ].join("\r\n");

    // the BOM is what makes Excel read ₹ and Indian scripts correctly
    const blob = new Blob(["﻿" + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emoraa-statement-${who}-${statement.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <ActionButton tone="secondary" size="sm" onClick={download}>
      {done ? "Downloaded" : "Download CSV"}
    </ActionButton>
  );
}
