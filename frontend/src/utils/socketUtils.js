/**
 * Socket URL utility — detects the correct socket.io server URL
 * across all environments (local dev, Coolify production).
 * 
 * In production (Coolify single-container): Nginx serves the frontend
 * and proxies /socket.io to the Express backend on localhost:3000.
 * So the socket URL should be the page's own origin (window.location.origin).
 * 
 * In development: VITE_API_URL is typically 'http://localhost:3000'.
 */
export function getSocketUrl() {
  const viteApiUrl = import.meta.env.VITE_API_URL;

  if (viteApiUrl) {
    // If VITE_API_URL is set, strip the /api suffix to get the base URL
    return viteApiUrl.replace(/\/api\/?$/, '');
  }

  // In production (Coolify), VITE_API_URL may not be baked in at build time.
  // Use the current page origin — Nginx proxies /socket.io to Express.
  if (import.meta.env.PROD) {
    return window.location.origin;
  }

  // Local development fallback
  return 'http://localhost:3000';
}
