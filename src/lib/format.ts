export function money(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n ?? 0);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function timeWindow(start: string | null, end: string | null): string {
  if (!start) return "On-demand (ASAP)";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const day = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return e ? `${day}, ${s.toLocaleTimeString("en-US", opts)}–${e.toLocaleTimeString("en-US", opts)}` : day;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
