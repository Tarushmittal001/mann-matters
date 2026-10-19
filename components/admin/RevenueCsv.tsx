"use client";

import { useState } from "react";
import type { Money } from "@/lib/payouts";

/**
 * The revenue table as a file, built in the browser from the rows already on
 * the page. No endpoint: adding a route that re-runs the query would be a
 * second place for the figures to come from, and the first time the two
 * disagreed nobody would know which to believe.
 */
export default function RevenueCsv({ rows, grain }: { rows: Money[]; grain: string }) {
  const [done, setDone] = useState(false);

  function download() {
    /* Quoted because a label like "5 Oct – 11 Oct" is fine but "Jan 2027" is
       not guaranteed to stay comma-free, and a stray comma silently shifts
       every column after it. Doubled quotes are the CSV escape. */
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      ["Period", "Sessions", "Free", "Collected", "Given away", "Refunded", "Net"].map(cell).join(","),
      ...rows.map((r) =>
        [r.label, r.sessions, r.free, r.collected, r.discounts, r.refunds, r.net].map(cell).join(",")
      ),
      [
        "Total",
        rows.reduce((n, r) => n + r.sessions, 0),
        rows.reduce((n, r) => n + r.free, 0),
        rows.reduce((n, r) => n + r.collected, 0),
        rows.reduce((n, r) => n + r.discounts, 0),
        rows.reduce((n, r) => n + r.refunds, 0),
        rows.reduce((n, r) => n + r.net, 0),
      ]
        .map(cell)
        .join(","),
    ].join("\r\n");

    // the BOM is what makes Excel read ₹ and any Indian script correctly
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emoraa-revenue-${grain}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="press rounded-full border border-forest-800/20 px-4 py-2 text-[0.85rem] font-medium text-forest-800 transition-colors hover:border-forest-800"
    >
      {done ? "Downloaded" : "Download CSV"}
    </button>
  );
}
