export async function openExternal(url: string): Promise<void> {
  if (!url) return;

  // Basic allowlist: only http(s)
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
  } catch {
    return;
  }

  // Electron (preferred)
  try {
    const w: any = window as any;
    if (w?.electron?.openExternal) {
      await w.electron.openExternal(url);
      return;
    }
  } catch {
    // ignore
  }

  // Web fallback
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    // ignore
  }
}





