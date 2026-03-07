const instagramUsernameRegex = /^[a-z0-9._]{1,30}$/;

export function normalizeInstagramUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

export function isValidInstagramUsername(value: string) {
  return instagramUsernameRegex.test(value);
}

export function extractInstagramUsername(input: unknown, fallbackName?: string | null) {
  if (input && typeof input === "object") {
    const profile = input as { username?: unknown };
    if (typeof profile.username === "string") {
      return normalizeInstagramUsername(profile.username);
    }
  }

  if (fallbackName) {
    const normalized = normalizeInstagramUsername(fallbackName);
    if (isValidInstagramUsername(normalized)) {
      return normalized;
    }
  }

  return null;
}
