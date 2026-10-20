const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const zarCentsFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatZarCents(cents: number): string {
  return `R ${zarCentsFormatter.format(cents / 100)}`;
}

export function formatCurrency(
  value: number | string,
  currency: string,
  compact = false,
): string {
  const amount =
    typeof value === "number"
      ? value
      : value.trim()
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(amount)) return "Unavailable";
  if (!/^[A-Z]{3}$/.test(currency)) return "Unavailable (invalid currency)";

  try {
    if (currency === "ZAR" && !compact) return zarFormatter.format(amount);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
      ...(compact
        ? { notation: "compact", maximumFractionDigits: 1 }
        : {}),
    }).format(amount);
  } catch (error) {
    if (error instanceof RangeError) return "Unavailable (invalid currency)";
    throw error;
  }
}
