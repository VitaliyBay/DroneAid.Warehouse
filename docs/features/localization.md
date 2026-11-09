# Feature: Localization

## Goal

Let team members use DroneAid Warehouse in their own language. The app is
available in English (source language), Ukrainian, Spanish, and Catalan,
matching the languages of the DroneAid.Barcelona community.

## Behavior

- A language switcher is on the sign-in page and in the app bar after sign-in.
  Changing it updates every screen immediately, without a reload.
- The first visit uses the browser's preferred language when it is one of the
  four supported languages, otherwise English. The choice is remembered in the
  browser (`localStorage`, key `droneaid.language`), per device.
- The page's `lang` attribute follows the selected language for screen readers.
- Dates, relative times ("2 days ago"), and plurals follow the selected
  language's rules (`Intl` APIs). Ukrainian uses its four plural forms.
- Server validation errors are translated: the API returns a stable `code`
  (for example `drone.code.duplicate`) with optional `args`, and the web app
  shows the matching translated text. An unknown code falls back to the
  English `message` from the API.

## What is translated and what is not

Translated: all screens, labels, buttons, validation messages, statuses, drone
types, empty states, confirmations, and API error messages.

Not translated, by design:

- **User data:** drone codes, nicknames, component names and notes, issue text,
  video labels. Users enter these in any language.
- **Default component names** (`Frame`, `Motor`, …) loaded when a drone is
  created are stored in English, like any other component data. Technical
  abbreviations stay unchanged across languages, as in the brand guide.
- **Browser-native controls:** the date picker and the `confirm` dialog use the
  browser's own language chrome.
- **Product name:** "DroneAid Barcelona".

## How it works

- Dictionaries live in `src/droneaid-barcelona-web/src/app/i18n/` (`en.ts`,
  `uk.ts`, `es.ts`, `ca.ts`). `en.ts` defines the keys; the other files are
  typed so the build fails if a key is missing or extra.
- Plural keys come in four forms (`.one`, `.few`, `.many`, `.other`) in every
  language, even where forms are identical, so the structure is uniform.
- `I18nService` offers `t(key, params)`, `plural(key, count)`, `date()`,
  `timeAgo()`, and `error()`; screens call it from templates.
- API error codes are defined in `DronesController` and `AuthenticationController`;
  each has an `error.<code>` entry in every dictionary.

## Adding or changing text

1. Add the key to `en.ts`, then to `uk.ts`, `es.ts`, and `ca.ts` (the build
   reports any dictionary that is missing it).
2. Use short, simple sentences (ASD-STE100 style) and leave room for text that
   is 15–30% longer than English; check phone layouts.
3. For a new API error, add a `code` in the controller and an `error.<code>`
   key in all four dictionaries.

## Adding a language

Create a dictionary typed as `Messages`, add it and its native name to
`LANGUAGES` and `DICTIONARIES` in `i18n.service.ts`, and add an entry to this
document.

## Open decisions

- Native-speaker review of the Ukrainian, Spanish, and Catalan texts. They
  were drafted with care but have not been reviewed by community members.
- Whether to translate the default component names, and how, without confusing
  edited names.
- Whether to store the language per user account instead of per browser, once
  roles and profiles exist.
