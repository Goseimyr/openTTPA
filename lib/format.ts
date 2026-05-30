export function formatDate(value: string | null | undefined) {
  if (!value) return "Ej angivet";
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "long" }).format(new Date(value));
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "Ej angivet";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0
  }).format(value);
}

export function publicCampaignUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/t/${slug}`;
}

export function normalizeOrganization<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
