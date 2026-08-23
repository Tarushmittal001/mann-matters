export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

export function formatDateISO(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
