import { AfterViewInit, Component, ElementRef, HostListener, inject, OnDestroy, output, signal, viewChild } from '@angular/core';
import type { IScannerControls } from '@zxing/browser';
import type { DecodeHintType } from '@zxing/library';

import { extractCodeFromOcrText } from '../core/scan-code';
import { I18nService } from '../i18n/i18n.service';

type ScanState = 'starting' | 'scanning' | 'unavailable';

/**
 * Full-screen scanner for QR codes, barcodes and printed text codes (for example DABCN0021).
 * Text is read with in-browser OCR (tesseract.js, self-hosted under /ocr) next to the ZXing decoder.
 * Uses the rear camera (works on Android and iPhone) and falls back to reading a photo,
 * which also works where the camera is blocked or the site is not served over HTTPS.
 * The ZXing decoder is loaded only when the scanner opens, so it does not slow the app down.
 */
@Component({
  selector: 'app-code-scanner',
  template: `
    <div class="backdrop" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('scan.title')">
      <div class="panel">
        <div class="bar">
          <h2>{{ i18n.t('scan.title') }}</h2>
          <button #closeButton type="button" class="da-btn da-btn-secondary da-btn-small" (click)="closed.emit()">
            {{ i18n.t('scan.close') }}
          </button>
        </div>

        <div class="view" [class.is-off]="state() === 'unavailable'">
          <video #video playsinline muted autoplay></video>
          @if (state() === 'scanning') {
            <div class="frame" aria-hidden="true"></div>
          }
          @if (state() === 'starting') {
            <p class="overlay">{{ i18n.t('scan.starting') }}</p>
          }
        </div>

        <p class="da-hint">{{ i18n.t('scan.hint') }}</p>
        @if (message()) {
          <p class="da-error" role="alert">{{ message() }}</p>
        }

        <label class="da-btn da-btn-secondary photo">
          {{ i18n.t('scan.photo') }}
          <input class="da-visually-hidden" type="file" accept="image/*" capture="environment" (change)="onPhoto($event)" />
        </label>
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      align-items: center;
      background: rgb(11 26 107 / 78%);
      display: flex;
      inset: 0;
      justify-content: center;
      padding: var(--da-space-3);
      position: fixed;
      z-index: 100;
    }

    .panel {
      background: var(--da-surface);
      border-radius: var(--da-radius-lg);
      box-shadow: var(--da-shadow-md);
      display: grid;
      gap: var(--da-space-3);
      max-height: 100%;
      max-width: 32rem;
      overflow: auto;
      padding: var(--da-space-4);
      width: 100%;
    }

    .bar {
      align-items: center;
      display: flex;
      gap: var(--da-space-3);
      justify-content: space-between;
    }

    h2 {
      font-size: var(--da-text-lg);
      margin: 0;
    }

    .view {
      aspect-ratio: 4 / 3;
      background: var(--da-navy);
      border-radius: var(--da-radius-md);
      overflow: hidden;
      position: relative;
    }

    .view.is-off {
      display: none;
    }

    video {
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .frame {
      border: 3px solid var(--da-yellow);
      border-radius: var(--da-radius-md);
      inset: 18%;
      pointer-events: none;
      position: absolute;
    }

    .overlay {
      align-items: center;
      color: var(--da-text-on-blue);
      display: flex;
      inset: 0;
      justify-content: center;
      margin: 0;
      position: absolute;
    }

    .photo {
      cursor: pointer;
      justify-content: center;
      position: relative;
    }

    .photo:focus-within {
      box-shadow: var(--da-focus-ring);
    }
  `
})
export class CodeScannerComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(I18nService);

  /** Raw text read from a code. */
  readonly scanned = output<string>();
  readonly closed = output<void>();

  readonly state = signal<ScanState>('starting');
  readonly message = signal('');

  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private controls: IScannerControls | null = null;
  private destroyed = false;
  private done = false;
  private ocrWorker: import('tesseract.js').Worker | null = null;
  private ocrTimer: ReturnType<typeof setTimeout> | null = null;
  private lastOcrCode: string | null = null;

  async ngAfterViewInit(): Promise<void> {
    this.closeButton().nativeElement.focus();
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.controls?.stop();
    if (this.ocrTimer) {
      clearTimeout(this.ocrTimer);
    }
    void this.ocrWorker?.terminate();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  private async createReader() {
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType: Hint }] = await Promise.all([
      import('@zxing/browser'),
      import('@zxing/library')
    ]);
    const hints = new Map<DecodeHintType, unknown>([
      [
        Hint.POSSIBLE_FORMATS,
        [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.DATA_MATRIX, BarcodeFormat.EAN_13]
      ],
      [Hint.TRY_HARDER, true]
    ]);
    return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
  }

  private async startCamera(): Promise<void> {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.unavailable('scan.insecure');
      return;
    }
    try {
      const reader = await this.createReader();
      const controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        this.video().nativeElement,
        (result) => {
          if (result) {
            this.finish(result.getText());
          }
        }
      );
      if (this.destroyed) {
        controls.stop();
        return;
      }
      this.controls = controls;
      this.state.set('scanning');
      this.scheduleOcr(0);
    } catch (error) {
      const name = (error as { name?: string } | null)?.name;
      this.unavailable(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'scan.denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'scan.noCamera'
            : 'scan.failed'
      );
    }
  }

  async onPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.message.set('');
    const url = URL.createObjectURL(file);
    try {
      const reader = await this.createReader();
      const result = await reader.decodeFromImageUrl(url);
      this.finish(result.getText());
    } catch {
      // No QR code or barcode in the photo: try reading printed text.
      const code = await this.readTextFromImage(url);
      if (code) {
        this.finish(code);
      } else {
        this.message.set(this.i18n.t('scan.noCode'));
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private async getOcrWorker() {
    if (!this.ocrWorker) {
      const { createWorker } = await import('tesseract.js');
      const base = (path: string) => new URL(path, document.baseURI).href;
      const worker = await createWorker('eng', 1, {
        workerPath: base('ocr/worker.min.js'),
        corePath: base('ocr/core'),
        langPath: base('ocr/lang'),
        gzip: true
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: '6' as never
      });
      if (this.destroyed) {
        void worker.terminate();
        throw new Error('closed');
      }
      this.ocrWorker = worker;
    }
    return this.ocrWorker;
  }

  /** Reads the printed code from the middle of the camera picture, about twice a second. */
  private scheduleOcr(delay: number): void {
    this.ocrTimer = setTimeout(() => void this.ocrFrame(), delay);
  }

  private async ocrFrame(): Promise<void> {
    if (this.destroyed || this.done) {
      return;
    }
    try {
      const video = this.video().nativeElement;
      if (video.videoWidth > 0) {
        const worker = await this.getOcrWorker();
        const sx = video.videoWidth * 0.1;
        const sy = video.videoHeight * 0.25;
        const sw = video.videoWidth * 0.8;
        const sh = video.videoHeight * 0.5;
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(900, Math.round(sw));
        canvas.height = Math.round((sh / sw) * canvas.width);
        canvas.getContext('2d')?.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const { data } = await worker.recognize(canvas);
        const code = extractCodeFromOcrText(data.text);
        // Accept a code only when two readings in a row agree, to avoid misreads.
        if (code && code === this.lastOcrCode) {
          this.finish(code);
          return;
        }
        this.lastOcrCode = code;
      }
    } catch {
      // OCR is a bonus on top of QR/barcode reading; keep scanning if it cannot run.
    }
    this.scheduleOcr(350);
  }

  private async readTextFromImage(url: string): Promise<string | null> {
    try {
      const worker = await this.getOcrWorker();
      const { data } = await worker.recognize(url);
      return extractCodeFromOcrText(data.text);
    } catch {
      return null;
    }
  }

  private finish(text: string): void {
    if (this.done) {
      return;
    }
    this.done = true;
    this.controls?.stop();
    if (this.ocrTimer) {
      clearTimeout(this.ocrTimer);
    }
    this.scanned.emit(text);
  }

  private unavailable(messageKey: string): void {
    this.state.set('unavailable');
    this.message.set(this.i18n.t(messageKey));
  }
}
