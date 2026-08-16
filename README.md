# NekoSubscriptionWeb

A **browser-only** analysis client for [NekoSubscription](https://github.com/YELANDAOKONG/NekoSubscription). Import the desktop app’s 13-column CSV in this tab to forecast upcoming charges. Nothing is uploaded. Refreshing the page, closing the tab, or importing a new file that replaces the session clears the rows.

- Repository: https://github.com/YELANDAOKONG/NekoSubscriptionWeb
- It does **not** edit, store, or sync subscriptions. Use the desktop app to manage them.

## Features

- **Overview** — Projected payments for the next 3 / 7 / 14 / 30 / 90 days, grouped by original currency (no conversion). Overdue items (next billing date already in the past) are listed separately.
- **Cost** — Equivalent monthly run-rate by currency. Daily fees use 365 days per year; weekly fees use 52 weeks.
- **Subscriptions** — Search, sort, and inspect every imported row. Inactive rows stay in the list but are excluded from forecasts.
- **Calendar** — Month view of projected charges.
- **Import** — File picker or drag-and-drop. A preview shows valid count, errors, and warnings; invalid rows are never imported silently.
- **Settings** — Language (`auto` / English / 简体中文 / 繁體中文 / 日本語) and theme (`auto` / light / dark). Only these preferences are saved in `localStorage`.

Cash-flow math matches the desktop projector (`CashFlowProjector`): occurrences expand from the next billing date (else start date). Month and year steps follow .NET `DateOnly.AddMonths` / `AddYears` (for example, 31 January + 1 month → end of February).

## CSV format

The parser matches the desktop export from `StandardSubscriptionCsvParser`. **Header text is ignored**; **column order** is the contract. Use a comma-separated UTF-8 file of at most 10 MB. A UTF-8 BOM, quoted fields, blank rows, and trailing empty columns are accepted. A non-empty 14th column is rejected.

| # | Typical header | Meaning |
| --- | --- | --- |
| 1 | SERVICE NAME | Provider. Required. |
| 2 | MEMBERSHIP NAME | Service / plan name. If empty, the provider name is used. |
| 3 | ACCOUNT IDENTIFIER | Account. Optional. |
| 4 | PERIODIC FEE | Amount. Non-negative. Leave empty only together with currency (treated as `0` / `XXX`). |
| 5 | CURRENCY | ISO 4217 (three letters) or a custom code of letters and digits, up to 10 characters. |
| 6 | PAYMENT CYCLE | `D` day, `W` week, `M` month, `Q` quarter, `HY` six months, `Y` year. |
| 7 | EFFECTIVE DATE | Start date. Optional. `M/d/yyyy`, `M/d/yy`, `yyyy-M-d`, `yyyy-MM-dd`, `yyyy/M/d`, `yyyy/MM/dd`. |
| 8 | EXPIRATION DATE | Next billing date in this web client. Optional. Cannot be earlier than the start date. |
| 9 | REMAINING VALIDITY | Unused. Leave empty. |
| 10 | SUBSCRIPTION MARKER | Active: `TRUE` / `FALSE` / `1` / `0`. Active rows are included in the forecast. |
| 11 | PAYMENT METHOD | `DIRECT`, `APPLE`, `GOOGLE`, `PAYPAL`, `BANK`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`, `OTHER`. |
| 12 | PAYMENT ACCOUNT | Required for `APPLE`, `GOOGLE`, and `PAYPAL`. Use `-` when there is no account. |
| 13 | NOTES | Optional. |

Import rules:

1. The first non-empty row is treated as a header and skipped.
2. Blank rows are ignored. Trailing empty columns are allowed.
3. Duplicate rows produce a warning and are still imported.
4. Every valid row becomes an ordinary recurring subscription. Inactive rows appear in the list only.

The in-app **About** page has the same table in the current display language.

## Getting started

Requires [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (Vite 8) and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Other scripts:

```bash
pnpm build    # vue-tsc then Vite production build
pnpm preview  # serve the production build locally
```

The app is a static Vite site. There is no backend, API, or server function.

## Stack

Vue 3 (`<script setup>`), TypeScript, Vite, Tailwind CSS v4, Pinia, Vue Router, Papa Parse, date-fns, shadcn-vue (New York, Reka UI, Lucide).

## Privacy

| Stored | Where |
| --- | --- |
| Language and theme | `localStorage` (`neko-subscription.locale`, `neko-subscription.theme`) |
| CSV bytes, parsed rows, projections | Memory only (Pinia). Dropped on refresh. |

Unknown or missing preference values behave as `auto`.
