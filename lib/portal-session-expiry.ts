export const portalSessionExpiredEvent = "brunova:portal-session-expired"

export function sessionExpiryDelay(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt)
  if (!Number.isFinite(expiry)) return null
  return Math.max(0, Math.min(expiry - now, 2_147_483_647))
}
