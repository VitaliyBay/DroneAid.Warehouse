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

/** Characters OCR commonly mistakes for digits when they appear in the numeric part of a code. */
const DIGIT_LOOKALIKES: Record<string, string> = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', B: '8' };

/**
 * Finds a printed drone code (letters followed by digits, for example DABCN0021) in text read by
 * OCR. Letters in the numeric part that look like digits (O, I, S, ...) are corrected.
 * Returns null when the text holds nothing shaped like a drone code.
 */
export function extractCodeFromOcrText(text: string | null | undefined): string | null {
  const upper = (text ?? '').toUpperCase().replace(/[^A-Z0-9\n ]/g, ' ');
  for (const match of upper.matchAll(/\b([A-Z]{2,8}?)([0-9OQDILZSB]{3,6})\b/g)) {
    const digits = match[2].replace(/[OQDILZSB]/g, (letter) => DIGIT_LOOKALIKES[letter]);
    // Require real digits so ordinary words (HELLO) are not mistaken for codes.
    if (/^[0-9]{3,6}$/.test(digits) && (match[2].match(/[0-9]/g) ?? []).length >= 2) {
      return match[1] + digits;
    }
  }
  return null;
}
