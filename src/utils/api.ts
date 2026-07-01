/**
 * Helper to compute full API URLs dynamically.
 * Read saved local IP from localStorage when running in real APK container.
 */
export const getBackendUrl = (path: string): string => {
  let base = localStorage.getItem('backend_server_ip') || '';
  if (base) {
    base = base.trim();
    if (!/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
  }
  // Trim trailing slash if present
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${path}`;
};
