export const USER_PROFILE_KEY = "finsight_user_profile";

export type CurrentUserProfile = {
  name: string | null;
  email: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function profileFromRecord(value: unknown): CurrentUserProfile {
  if (!isRecord(value)) return { name: null, email: null };
  const user = isRecord(value.user) ? value.user : value;
  return {
    name: firstString(user.full_name, user.name, user.display_name, user.preferred_username, user.username),
    email: firstString(user.email),
  };
}

function profileFromToken(token: string | null): CurrentUserProfile {
  if (!token) return { name: null, email: null };
  try {
    const payload = token.split(".")[1];
    if (!payload) return { name: null, email: null };
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return profileFromRecord(JSON.parse(decoded));
  } catch {
    return { name: null, email: null };
  }
}

export function saveCurrentUserProfile(response: unknown, token: string, loginEmail: string): void {
  const responseProfile = profileFromRecord(response);
  const tokenProfile = profileFromToken(token);
  const profile = {
    name: firstString(responseProfile.name, tokenProfile.name),
    email: firstString(responseProfile.email, tokenProfile.email, loginEmail),
  };
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function getCurrentUserProfile(): CurrentUserProfile {
  let storedProfile: CurrentUserProfile = { name: null, email: null };
  const stored = localStorage.getItem(USER_PROFILE_KEY);
  if (stored) {
    try {
      storedProfile = profileFromRecord(JSON.parse(stored));
    } catch {
      storedProfile = { name: null, email: null };
    }
  }

  const tokenProfile = profileFromToken(localStorage.getItem("finsight_access_token"));
  return {
    name: firstString(tokenProfile.name, storedProfile.name),
    email: firstString(tokenProfile.email, storedProfile.email),
  };
}
