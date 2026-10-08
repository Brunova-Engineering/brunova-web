export function hasAllowedOrigin(request: Request, siteUrl: URL): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return false

  try {
    if (new URL(origin).origin !== siteUrl.origin) return false
  } catch {
    return false
  }

  const fetchSite = request.headers.get("sec-fetch-site")
  return fetchSite === null || fetchSite === "same-origin"
}
