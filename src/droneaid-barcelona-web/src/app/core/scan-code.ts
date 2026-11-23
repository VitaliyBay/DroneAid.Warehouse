const MAX_CODE_LENGTH = 50;

/**
 * Turns the text read from a QR code or barcode into a drone code.
 * Labels normally hold the code itself (for example DABCN0001), but a QR code may also hold a
 * link to the drone: then the code is taken from a `code` query value or the last path segment.
 * Returns null when nothing usable was read.
 */
export function extractDroneCode(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim();
  if (!text) {
    return null;
  }

  let candidate = text;
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const fromQuery = url.searchParams.get('code');
      const lastSegment = url.pathname.split('/').filter(Boolean).pop();
      candidate = (fromQuery ?? (lastSegment ? decodeURIComponent(lastSegment) : '')).trim();
    } catch {
      return null;
    }
  } else {
    // Some scanners add a trailing newline or read several lines; the first line is the value.
    candidate = text.split(/\r?\n/)[0].trim();
  }

  if (!candidate || candidate.length > MAX_CODE_LENGTH || /\s/.test(candidate)) {
    return null;
  }
  return candidate;
}
