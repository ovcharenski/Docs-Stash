const STORAGE_KEY = 'docs-stash-last-error';

export function saveError(error: unknown) {
  try {
    const payload = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export function getLastError(): { message: string; stack?: string; timestamp: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { message: string; stack?: string; timestamp: string };
  } catch {
    return null;
  }
}

export function clearLastError() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
