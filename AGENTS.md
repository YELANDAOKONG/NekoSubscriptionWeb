# AGENTS.md

Guidance for coding agents working in this repository.

## What this app is

A **browser-only** Vue 3 app that imports a NekoSubscription CSV, analyzes upcoming payments in memory, and forgets the data on refresh.

It is a **read-only analysis client** for the desktop product at `../NekoSubscription` (Avalonia / .NET). Match that project's CSV contract and cash-flow math. Do not reimplement the desktop editor, SQLite store, tags, payment-profile CRUD, or specialized subscription subtypes.

## Hard constraints

- **No backend.** Static Vite app only. No API routes, no server functions.
- **No subscription persistence.** Imported CSV rows and all analysis live in memory (Pinia). Refresh, close, or a new import that replaces the session must drop them.
- **Persist only UI preferences:** language and theme, in `localStorage`. Apply changes immediately; do not add a Save button.
- **Do not add, remove, or bump dependencies** unless the user explicitly authorizes the package. Use what is already in `package.json`.
- **Do not use `vue-i18n`.** Locales are typed TypeScript catalogs in this repo.
- **Do not use `src/components/ui/chart`** until `@unovis/vue` is an authorized dependency. Forecast totals are cards and lists, not charts.
- Thrown errors, logs, and other **runtime text stay in English**. Visible UI strings go through `t()`. Comments may be English or Chinese.

## Stack

Vue 3 (`<script setup>`), TypeScript, Vite, Tailwind CSS v4, Pinia, Vue Router, Papa Parse, date-fns, shadcn-vue (New York, Reka UI, Lucide). Alias `@` → `src/`.

Compose existing components under `src/components/ui/`. Do not rewrite generated UI primitives unless a bug in them blocks the app.

## Localization

Preference values: `auto` | `en` | `zh-Hans` | `zh-Hant` | `ja`.

`auto` follows `navigator.language` / `navigator.languages`:

1. `ja*` → `ja`
2. `zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO` → `zh-Hant`
3. other `zh*` → `zh-Hans`
4. everything else → `en`

Implementation:

- English catalog is the source of truth (`as const`). `zh-Hans`, `zh-Hant`, and `ja` must type-check as `Record<keyof typeof en, string>` so a missing key fails `vue-tsc`.
- `t(key, ...args)` interpolates `{0}`-style placeholders (same idea as desktop `AppResources.Format`).
- Set `document.documentElement.lang` when the resolved locale changes.
- Format dates with `date-fns` locales already shipped in that package (`en-US`, `zh-CN`, `zh-TW`, `ja`).
- Language option **labels keep their native names** (English, 简体中文, 繁體中文, 日本語) so the switcher stays findable. The Automatic option is translated.

## Theme

Preference values: `auto` | `light` | `dark`.

shadcn dark mode is the `dark` class on `document.documentElement` (`@custom-variant dark (&:is(.dark *))`). Do not drive shadcn tokens from a raw `@media (prefers-color-scheme: dark)` block on `:root`.

- `light`: remove `dark`
- `dark`: add `dark`
- `auto`: follow `prefers-color-scheme` and listen for changes

Apply the class from a small synchronous script in `index.html` **before** Vue boots, reading `localStorage`, so the first paint is not the wrong theme. Keep Sonner in sync with the resolved (not preferred) theme.

## CSV import (desktop parity)

Parse the 13-column export from `NekoSubscription.Core/DataManagement/StandardSubscriptionCsvParser.cs`. Header **text is ignored**; column **order** is the contract.

| Index | Field |
| --- | --- |
| 0 | Provider (required) |
| 1 | Service name (falls back to provider) |
| 2 | Account |
| 3–4 | Amount, currency (both empty → `0` / `XXX`) |
| 5 | Cycle: `D` `W` `M` `Q` `HY` `Y` |
| 6–7 | Start date, next billing date |
| 9 | Active marker: `TRUE`/`FALSE`/`1`/`0` |
| 10–12 | Payment channel, payment account, notes |

Also match: UTF-8 BOM, quoted fields, skip blank rows, allow trailing empty columns, reject a non-empty 14th column, 10 MiB cap, duplicate-row warnings, date formats `M/d/yyyy`, `M/d/yy`, `yyyy-M-d`, `yyyy-MM-dd`, `yyyy/M/d`, `yyyy/MM/dd`. Apple / Google / PayPal require a payment account. Papa Parse defaults are not the same as .NET `TextFieldParser`; configure and test against the desktop cases.

Every valid row becomes an **ordinary recurring** subscription. Active → participates in budget; inactive → list only, excluded from forecast. Do not invent cloud, domain, or phone-number subtypes from CSV.

## Cash-flow analysis (desktop parity)

Port `NekoSubscription.Core/CashFlow/CashFlowProjector.cs`. Expand occurrences from next billing date (else start date) across the selected window using day / week / month / year intervals. Month and year arithmetic must match .NET `DateOnly.AddMonths` / `AddYears` (e.g. 31 Jan + 1 month → end of February). Only budget-participating subscriptions are projected.

Dashboard periods: 3 / 7 / 14 / 30 / 90 days. Also show overdue items (recorded next billing date before today) and a month calendar of projected charges. Group totals by currency.

## UI map

| Route | Role | Primary UI |
| --- | --- | --- |
| `/` | Forecast | Cards, period tabs/buttons, upcoming list, overdue alert, empty |
| `/subscriptions` | Imported table | Table, badges, filter input, empty |
| `/calendar` | Month charges | Compose `Calendar` primitives; it is a date-picker kit, not a billing month view |
| `/settings` | Language and theme | Select; persist on change |
| `/about` | Project intro and 13-column CSV format | Cards, table, GitHub link |

Import from the chrome: file picker → dialog preview (valid count, error/warning table) → confirm into the session store → toast. Never silently drop invalid rows.

## Preferences storage

Suggested keys:

- `neko-subscription.locale` → `auto` \| `en` \| `zh-Hans` \| `zh-Hant` \| `ja`
- `neko-subscription.theme` → `auto` \| `light` \| `dark`

Unknown or missing values behave as `auto`. Do not store CSV bytes, parsed rows, or projections.

## Desktop reference

When behavior is ambiguous, the desktop source wins:

- CSV: `../NekoSubscription/NekoSubscription.Core/DataManagement/`
- Projection: `../NekoSubscription/NekoSubscription.Core/CashFlow/CashFlowProjector.cs`
- Strings to mirror: `../NekoSubscription/NekoSubscription/Resources/Strings*.resx` (add Japanese here; desktop has no `ja` catalog)
