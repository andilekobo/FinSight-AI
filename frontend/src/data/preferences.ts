export const PREFERENCES_KEY = "finsight_preferences";

export type UserPreferences = {
  theme: "light" | "dark";
  currency: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  hideFinancialAmounts: boolean;
  aiResponseStyle: "balanced" | "concise" | "detailed";
};

export const defaultPreferences: UserPreferences = {
  theme: "light",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  hideFinancialAmounts: false,
  aiResponseStyle: "balanced",
};

export function getPreferences(): UserPreferences {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  if (!stored) return defaultPreferences;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return defaultPreferences;
    const value = parsed as Partial<UserPreferences>;
    return {
      theme: value.theme === "dark" ? "dark" : "light",
      currency: typeof value.currency === "string" ? value.currency : defaultPreferences.currency,
      dateFormat: value.dateFormat === "DD/MM/YYYY" || value.dateFormat === "YYYY-MM-DD"
        ? value.dateFormat
        : "MM/DD/YYYY",
      hideFinancialAmounts: value.hideFinancialAmounts === true,
      aiResponseStyle: value.aiResponseStyle === "concise" || value.aiResponseStyle === "detailed"
        ? value.aiResponseStyle
        : "balanced",
    };
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: UserPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);
}

export function applyPreferences(preferences: UserPreferences): void {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.financialAmounts = preferences.hideFinancialAmounts ? "hidden" : "visible";
}
