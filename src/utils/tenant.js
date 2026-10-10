// Resolves which "workspace" (shop) subdomain the app is running on, if any.
// The root domain is env-configured and defaults to localhost, where
// <slug>.localhost works with zero setup in Chrome/Firefox/Edge - no
// wildcard DNS needed for local development. On any other host (today's
// existing Vercel/infobridgenia deployments), getCurrentSlug() returns null
// and the app behaves exactly as it does today.

export function getRootDomain() {
  return process.env.REACT_APP_ROOT_DOMAIN || 'localhost'
}

export function getCurrentSlug() {
  const host = window.location.hostname
  const root = getRootDomain()

  if (host === root || host === `www.${root}`) return null
  if (host.endsWith(`.${root}`)) return host.slice(0, -(root.length + 1))
  return null
}
