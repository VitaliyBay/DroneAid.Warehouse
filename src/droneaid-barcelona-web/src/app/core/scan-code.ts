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

function normalizeTail(tail: string): string | null {
  const digits = tail.replace(/[OQDILZSB]/g, (letter) => DIGIT_LOOKALIKES[letter]);
  return /^[0-9]{3,6}$/.test(digits) ? digits : null;
}

/**
 * Finds printed drone codes (letters followed by digits, for example DABCN0021) in text read by
 * OCR. The best reading comes first. OCR often misreads a 0 or adds/drops a character next to it,
 * so close variants follow: letters that look like digits (O, I, S, ...) are corrected, a single
 * extra character is removed, or a single 0 is added. The caller can check them against the
 * registry. Returns an empty list when the text holds nothing shaped like a drone code.
 */
export function ocrCodeCandidates(text: string | null | undefined): string[] {
  const upper = (text ?? '').toUpperCase().replace(/[^A-Z0-9\n ]/g, ' ');
  for (const match of upper.matchAll(/\b([A-Z]{2,8}?)([0-9OQDILZSB]{3,6})\b/g)) {
    const prefix = match[1];
    const raw = match[2];
    const primary = normalizeTail(raw);
    // Require real digits so ordinary words (HELLO) are not mistaken for codes.
    if (!primary || (raw.match(/[0-9]/g) ?? []).length < 2) {
      continue;
    }
    const tails = [primary];
    for (let i = 0; i < raw.length; i++) {
      tails.push(normalizeTail(raw.slice(0, i) + raw.slice(i + 1)) ?? '');
    }
    for (let i = 0; i <= primary.length; i++) {
      tails.push(primary.slice(0, i) + '0' + primary.slice(i));
    }
    return [...new Set(tails.filter((tail) => /^[0-9]{3,6}$/.test(tail)))].map((tail) => prefix + tail);
  }
  return [];
}

/** The most likely printed drone code in OCR text, or null. */
export function extractCodeFromOcrText(text: string | null | undefined): string | null {
  return ocrCodeCandidates(text)[0] ?? null;
}
