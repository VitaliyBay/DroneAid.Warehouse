import { Injectable, signal } from '@angular/core';

import { ca } from './ca';
import { en, MessageKey, Messages } from './en';
import { es } from './es';
import { uk } from './uk';

export type Language = 'en' | 'uk' | 'es' | 'ca';

export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'uk', name: 'Українська' },
  { code: 'es', name: 'Español' },
  { code: 'ca', name: 'Català' }
];

const DICTIONARIES: Record<Language, Messages> = { en, uk, es, ca };
const STORAGE_KEY = 'droneaid.language';

type Params = Record<string, string | number>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Language>(this.initialLanguage());

  constructor() {
    document.documentElement.lang = this.lang();
  }

  setLanguage(language: Language): void {
    this.lang.set(language);
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts until reload.
    }
  }

  /** Translate a key, replacing {placeholders}. Reading lang() makes templates re-render on change. */
  t(key: string, params?: Params): string {
    const text = (DICTIONARIES[this.lang()] as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key;
    return this.fill(text, params);
  }

  /** Translate a plural key family (key.one / .few / .many / .other) using the language's plural rules. */
  plural(key: string, count: number, params?: Params): string {
    const category = new Intl.PluralRules(this.lang()).select(count);
    const dictionary = DICTIONARIES[this.lang()] as Record<string, string>;
    const text = dictionary[`${key}.${category}`] ?? dictionary[`${key}.other`] ?? key;
    return this.fill(text, { n: count, ...params });
  }

  /** Message for an API error: translate its code when known, else use its text, else the fallback. */
  error(error: unknown, fallbackKey: MessageKey): string {
    const body = (error as { error?: { code?: string; message?: string; args?: Params } } | null)?.error;
    const key = `error.${body?.code}` as MessageKey;
    if (body?.code && key in en) {
      return this.t(key, body.args);
    }
    return body?.message ?? this.t(fallbackKey);
  }

  date(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return new Intl.DateTimeFormat(this.lang(), { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(value)
    );
  }

  timeAgo(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const formatter = new Intl.RelativeTimeFormat(this.lang(), { numeric: 'auto' });
    const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60) {
      return formatter.format(0, 'second');
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return formatter.format(-minutes, 'minute');
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return formatter.format(-hours, 'hour');
    }
    const days = Math.floor(hours / 24);
    if (days < 14) {
      return formatter.format(-days, 'day');
    }
    if (days < 60) {
      return formatter.format(-Math.floor(days / 7), 'week');
    }
    return this.date(value);
  }

  private fill(text: string, params?: Params): string {
    return params ? text.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match)) : text;
  }

  private initialLanguage(): Language {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (LANGUAGES.some((item) => item.code === stored)) {
        return stored as Language;
      }
    } catch {
      // ignore: fall back to the browser language
    }
    const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((item) =>
      item.slice(0, 2).toLowerCase()
    );
    return LANGUAGES.find((item) => preferred.includes(item.code))?.code ?? 'en';
  }
}
