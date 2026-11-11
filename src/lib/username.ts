// Usernames: 3–30 letters, digits, dots or underscores, never "@" (design.md §12, Phase 6A).
export const USERNAME_PATTERN = '[A-Za-z0-9._]{3,30}'

/** A starting suggestion from an email, e.g. ann.smith@example.com -> ann.smith. */
export function suggestUsername(email: string): string {
  const base = (email.split('@')[0] ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 26)
  return base.length >= 3 ? base : `user${base}`
}

/** How a user is shown in the app: username#id, e.g. ann.smith#12. */
export function userTag(user: { username: string; id: number }): string {
  return `${user.username}#${user.id}`
}
