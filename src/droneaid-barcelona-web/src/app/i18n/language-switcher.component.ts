import { Component, inject } from '@angular/core';

import { I18nService, Language, LANGUAGES } from './i18n.service';

@Component({
  selector: 'app-language-switcher',
  template: `
    <label class="da-visually-hidden" for="language">{{ i18n.t('lang.label') }}</label>
    <select
      id="language"
      class="lang-select"
      [value]="i18n.lang()"
      (change)="choose($any($event.target).value)"
    >
      @for (item of languages; track item.code) {
        <option [value]="item.code" [selected]="item.code === i18n.lang()">{{ item.name }}</option>
      }
    </select>
  `,
  styles: `
    .lang-select {
      background: transparent;
      border: 1.5px solid var(--da-border-strong);
      border-radius: var(--da-radius-pill);
      color: var(--da-text);
      cursor: pointer;
      font: 600 var(--da-text-sm) var(--da-font-body);
      min-height: 2.25rem;
      padding: 0 var(--da-space-3);
    }

    :host-context(.da-appbar) .lang-select {
      border-color: rgb(255 255 255 / 40%);
      color: var(--da-cream);
    }

    :host-context(.da-appbar) .lang-select option {
      color: var(--da-ink);
    }
  `
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);
  readonly languages = LANGUAGES;

  choose(code: string): void {
    this.i18n.setLanguage(code as Language);
  }
}
