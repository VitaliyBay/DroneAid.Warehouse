import { extractCodeFromOcrText, extractDroneCode, ocrCodeCandidates } from './scan-code';

describe('extractDroneCode', () => {
  it('returns a plain code unchanged', () => {
    expect(extractDroneCode('DABCN0001')).toBe('DABCN0001');
  });

  it('trims spaces and keeps only the first line', () => {
    expect(extractDroneCode('  DABCN0001 \r\nextra')).toBe('DABCN0001');
  });

  it('reads the code from a link path', () => {
    expect(extractDroneCode('https://example.org/drones/DABCN0002')).toBe('DABCN0002');
  });

  it('prefers a code query value in a link', () => {
    expect(extractDroneCode('https://example.org/scan?code=DABCN0003&x=1')).toBe('DABCN0003');
  });

  it('decodes an encoded path segment', () => {
    expect(extractDroneCode('https://example.org/d/DAB%20CN')).toBeNull();
    expect(extractDroneCode('https://example.org/d/DAB%2DCN1')).toBe('DAB-CN1');
  });

  it('rejects empty, blank, long, and multi-word values', () => {
    expect(extractDroneCode('')).toBeNull();
    expect(extractDroneCode('   ')).toBeNull();
    expect(extractDroneCode(null)).toBeNull();
    expect(extractDroneCode('A'.repeat(51))).toBeNull();
    expect(extractDroneCode('two words')).toBeNull();
  });

  it('rejects a link without a usable code', () => {
    expect(extractDroneCode('https://example.org/')).toBeNull();
  });
});

describe('extractCodeFromOcrText', () => {
  it('finds a printed code among other words', () => {
    expect(extractCodeFromOcrText('DroneAid\nDABCN0021\nBarcelona')).toBe('DABCN0021');
  });

  it('corrects letters read in place of digits', () => {
    expect(extractCodeFromOcrText('DABCN00Z1')).toBe('DABCN0021');
    expect(extractCodeFromOcrText('DABCNOO21')).toBe('DABCN0021');
  });

  it('ignores text without a code', () => {
    expect(extractCodeFromOcrText('hello world 12')).toBeNull();
    expect(extractCodeFromOcrText('')).toBeNull();
    expect(extractCodeFromOcrText(null)).toBeNull();
  });
});

describe('ocrCodeCandidates', () => {
  it('lists the best reading first and includes a version without an extra character', () => {
    const candidates = ocrCodeCandidates('DABCNO0021');
    expect(candidates[0]).toBe('DABCN00021');
    expect(candidates).toContain('DABCN0021');
  });

  it('includes a version with a dropped 0 restored', () => {
    expect(ocrCodeCandidates('DABCN021')).toContain('DABCN0021');
  });

  it('has no duplicates and nothing for ordinary text', () => {
    const candidates = ocrCodeCandidates('DABCN0021');
    expect(new Set(candidates).size).toBe(candidates.length);
    expect(ocrCodeCandidates('hello world')).toEqual([]);
  });
});
