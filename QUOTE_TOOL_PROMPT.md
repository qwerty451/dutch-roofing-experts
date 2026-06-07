# Master Execution Prompt — Dutch Roofing Experts Quote Tool

Copy everything below this line and send it as your first message.

---

You are the lead AI engineer on a complex feature build for an existing Next.js website. You will act as a **team lead / manager**: you read the full spec and TODO list, break work into parallel streams, spawn subagents to execute specific tasks, review their output, and integrate everything. You do not do all the work yourself — you delegate, verify, and coordinate.

## Your Role

- **You are the manager.** You hold the overall plan and quality bar.
- **Subagents are your engineers.** Spawn them for well-scoped tasks. Give each subagent a complete, self-contained brief — they have no memory of prior conversation or other subagents.
- **You verify before moving on.** After each subagent completes, read the files they created/edited and confirm correctness before proceeding to dependent tasks.
- **You integrate.** When subagents produce parallel work, you wire it together.
- **You run the final QA.** After all stages, you do a full end-to-end check yourself.

## Project Context

This is a Next.js (App Router) + TypeScript + Tailwind CSS website for **Dutch Roofing Experts** — a Dutch roofing company operating in Costa Blanca South, Spain. The project lives at `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`.

**Existing structure you must NOT break:**
- `app/page.tsx` — main marketing site (single page: Hero, Services, About, Contact, Footer)
- `app/layout.tsx` — root layout with site navbar/footer
- `app/globals.css` — global styles
- `data/content.json` — site translations and image config
- `app/api/contact/route.ts` — contact form email (nodemailer/Gmail)
- `public/uploads/` — site images
- Color scheme: `bg-black` / `bg-gray-950`, red `#cc0000`, gold `#d4af37`
- SMTP env vars already configured: `SMTP_USER`, `SMTP_PASS`, `SMTP_TO`

**IMPORTANT — Read before writing any code:**
Read `node_modules/next/dist/docs/` for this version's API. This may not be the Next.js you know. Check for breaking changes before using any Next.js API.

## The Feature to Build

A hidden, password-protected internal sales/quote tool at `/tool`. Full specification is in `QUOTE_TOOL_SPEC.md` and the task list is in `QUOTE_TOOL_TODO.md`. **Read both files completely before starting.**

### Summary of the system:

**4 phases rendered on a single route `/tool` with no site navbar/footer:**

**Phase 1 — Login:** PIN entry. Employees: `0404` = Laurens van Heijst, `2501` = Tim van Heijst. Store employee name in sessionStorage.

**Phase 2 — Margin pre-set (hidden from customer):** Employee sets independent upcharge multipliers for: Materiaalkosten / Uurtarief / Alles. Options: +0% to +50%. All margins stack. These are NEVER shown to the customer or in the PDF — only final computed prices are shown.

**Phase 3 — Quote builder (with customer):** 
- Customer info fields (top)
- Building info (floors, type, accessibility)
- Elaborate roof configurator loaded from `pricing.json` — categories: Plat Dak (bitumen/EPDM/grind/liquid), Pannendak (beton/keramisch/leien/metaal), Goten & Afwatering, Schoorsteen & Nokwerk, Dakramen & Lichtkoepels, Zonnepanelen (dakwerk), Isolatie, Overig. Each with sub-options for material type, thickness, quality, etc.
- Equipment rentals (container, steigers, pannenlift, hoogwerker, etc.)
- Custom line items (freeform, Phase 2 margins do NOT apply)
- Discount selector 0–5% (stacks on top of all margins, visible on PDF)
- Editable payment terms
- **Persistent price footer** always visible: subtotaal ex BTW | BTW 21% | totaal incl. BTW

**Phase 3→4 Checkup popups:** Before advancing, smart checks run in sequence. If scaffolding missing for multi-story, if no tile lift for tile roof, etc. "Ja" adds item and returns to Phase 3. "Nee" advances to next check. See spec for all 7 checks.

**Phase 4 — Review & Output:**
- Clean customer-facing quote summary (Phase 2 markup hidden)
- Language selector before PDF: NL / EN / ES
- PDF download (jsPDF + jspdf-autotable, client-side)
- Email to customer (nodemailer, company always CC'd)
- Quote saved with sequential number `DRE-YYYY-NNN` to `/data/quotes.json`

**PDF includes:** Logo, company contact, quote number, date, 14-day validity, customer details, itemized table, subtotaal/BTW/korting/totaal, payment terms, signature block. All labels translate to NL/EN/ES.

**Pricing:** All base prices for Alicante/Valencia region in `pricing.json` (root). Each category and item has `enabled: true/false`. Employees can edit this file to adjust prices.

**UI language:** Toggle NL/EN in top-right throughout all phases. PDF language chosen separately at Phase 4.

---

## Execution Plan — Follow This Order

### Step 1 — Read everything first
Read `QUOTE_TOOL_SPEC.md` and `QUOTE_TOOL_TODO.md` in full. Read `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `data/content.json` to understand existing patterns. Read `app/api/contact/route.ts` to understand the nodemailer setup.

### Step 2 — Spawn Subagent A: Foundation files (blocking — everything depends on this)

**Brief for Subagent A:**
> You are building the foundation files for a quote tool in a Next.js + TypeScript + Tailwind project at `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` first. Your tasks:
> 1. Create `pricing.json` in the project root. Include ALL categories from the spec with realistic Alicante/Valencia market prices (2024-2026 rates). Every category and item must have `enabled: true` and names in nl/en/es. Include: Plat Dak (bitumen with all thickness/quality options, EPDM, grind, liquid coating), Pannendak (beton, keramisch, leien, metaal), Goten & Afwatering, Schoorsteen & Nokwerk, Dakramen & Lichtkoepels (Velux sizes, lichtkoepels), Zonnepanelen dakwerk, Isolatie, Overig dakwerk. Equipment: container (6m³/10m³/20m³), steigers (per week per vak), pannenlift, hoogwerker (12m/18m/24m), aanhangwagen, veiligheidslijn, loopplanken. Labor baseHourlyRate: 45.
> 2. Create `/data/quotes.json` with content: `{"lastNumber": 0, "quotes": []}`
> 3. Create `lib/pricing.ts` — TypeScript module that imports and types `pricing.json`, exports a function `applyMargins(basePrice: number, margins: Margins, type: 'material' | 'labor' | 'both'): number` that applies Phase 2 margin multipliers.
> 4. Create `lib/quoteStorage.ts` — functions: `saveQuote(quote)` reads `/data/quotes.json`, increments lastNumber, pushes quote, writes back. `getQuotes()` reads and returns all. `generateQuoteId(year, number)` returns `DRE-2026-001` format.
> 5. Create `app/tool/layout.tsx` — a layout that renders ONLY `{children}` with no site navbar or footer. Apply `bg-black min-h-screen text-white`.
> 6. Create `app/tool/page.tsx` — a client component that holds the phase state machine. State: `phase: 1|2|3|4`, `employee: string`, `margins: {material: number, labor: number, universal: number}`, `quoteData: QuoteData` (full typed quote state). Renders `<Phase1Login>`, `<Phase2Margins>`, `<Phase3Quote>`, `<Phase4Review>` based on phase. Import these as placeholder components for now (you don't need to build them — just import and render).
> Write TypeScript throughout. Follow the existing project's code style.

After Subagent A completes: verify `pricing.json` is comprehensive, all types are correct in `lib/pricing.ts`, the layout strips nav/footer.

### Step 3 — Spawn Subagent B and Subagent C in parallel

**Brief for Subagent B — Phase 1 + Phase 2 + shared UI:**
> You are building Phase 1 (Login) and Phase 2 (Margin Pre-set) components for a quote tool in a Next.js project at `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` first. The app is already set up — `app/tool/page.tsx` exists and imports these components.
>
> Design system: bg-black/bg-gray-950 backgrounds, `#cc0000` red, `#d4af37` gold, Tailwind CSS, all buttons min 48px height (mobile/iPad).
>
> Build:
> 1. `components/tool/PhaseProgress.tsx` — shows progress bar/steps 1→2→3→4, current phase highlighted in gold. Used in all phases.
> 2. `components/tool/LanguageToggle.tsx` — NL/EN toggle button, top-right fixed position. Uses React context or prop. Small, unobtrusive.
> 3. `components/tool/Phase1Login.tsx` — full-screen, logo centered (use `/uploads/logo.png`), 4-digit PIN input with large number buttons (or standard input with inputMode="numeric"), submit button, red error on wrong code. Employee map: `{"0404": "Laurens van Heijst", "2501": "Tim van Heijst"}`. On success: call `onLogin(employeeName: string)` prop.
> 4. `components/tool/Phase2Margins.tsx` — 3 rows (Materiaalkosten / Uurtarief per medewerker / Alles). Each row has button group: +0% +10% +20% +30% +40% +50%. Active = gold background. Brief note: "Deze marges zijn alleen voor jou zichtbaar." "Doorgaan →" button calls `onComplete(margins)` prop with `{material: number, labor: number, universal: number}` as multipliers (e.g. +20% = 1.2).
>
> All components are "use client". TypeScript with proper prop types.

**Brief for Subagent C — PDF Generator:**
> You are building the PDF generation library for a quote tool in a Next.js project at `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` for the exact PDF layout. Check if `jspdf` and `jspdf-autotable` are in `package.json` — if not, add them.
>
> Build `lib/pdfGenerator.ts`:
> - Accepts: `QuoteData` object (customer info, line items, totals, discount, payment terms, quote ID, date, language: 'nl'|'en'|'es')
> - Returns: `Blob` (PDF file)
> - Layout: dark header bar with logo path reference, company name + contact right-aligned, quote number + date + "Geldig tot" (14 days from date), customer details block, itemized table (omschrijving | eenheid | aantal | prijs p/e | totaal), subtotaal / BTW / korting line (if discount > 0) / totaal incl BTW (bold, larger), payment terms, signature block (two columns: klant + medewerker/bedrijf).
> - Translation: all labels in NL/EN/ES. Define a `translations` object in the file.
> - Company colors: use jsPDF `setFillColor` / `setTextColor` to apply dark header (#111111), gold accents (#d4af37), red (#cc0000).
> - Logo: load from public URL or base64 encode `/public/uploads/logo.png` — handle gracefully if it fails.
> - Also build `lib/quoteTranslations.ts` with full NL/EN/ES strings for all PDF labels.
>
> TypeScript. Export: `generatePDF(quoteData: QuoteData): Promise<Blob>`

After both B and C complete: verify components render, PDF function exports correctly.

### Step 4 — Spawn Subagents D1, D2, D3 in parallel (Phase 3 sub-configurators — most complex)

**Brief for Subagent D1 — Flat Roof + Tiled Roof configurators:**
> You are building roof configurator sub-components for Phase 3 of a quote tool. Project: `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` and `pricing.json` (in root) first.
>
> Build:
> 1. `components/tool/Phase3/FlatRoofConfigurator.tsx` — handles Plat Dak. Sub-categories: Bitumen, EPDM, Grind, Liquid coating. For each: m² input, all spec dropdowns/toggles per spec (dikte, kwaliteit, lagen, isolatie ja/nee → sub-options, oude bedekking verwijderen ja/nee). Each selection computes line items using base prices from `pricing.json`. Calls `onItemsChange(items: LineItem[])` prop.
> 2. `components/tool/Phase3/TiledRoofConfigurator.tsx` — handles Pannendak. Sub-categories: Betonpannen, Keramisch, Leien, Metaal/Staande naad. Fields per spec. Computes line items.
>
> A `LineItem` has: `{ id, description: {nl, en, es}, unit, quantity, unitPrice, total, vatRate: 0.21 }`
>
> Design: accordion or tab layout per sub-category, large inputs, gold active states. Mobile-friendly. "use client" TypeScript components.
>
> Apply margins via `applyMargins()` from `lib/pricing.ts` — accept `margins` prop from parent.

**Brief for Subagent D2 — Drainage, Chimney, Skylights, Solar configurators:**
> You are building roof configurator sub-components for Phase 3 of a quote tool. Project: `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` and `pricing.json` first.
>
> Build:
> 1. `components/tool/Phase3/GuttersConfigurator.tsx` — Goten & Afwatering (types, meters, HWA)
> 2. `components/tool/Phase3/ChimneyConfigurator.tsx` — Schoorsteen & Nokwerk (voegen, lood, kap, nokvorsten, kilgoten)
> 3. `components/tool/Phase3/SkylightsConfigurator.tsx` — Dakramen & Lichtkoepels (Velux sizes/types, lichtkoepels, dakdoorvoeren)
> 4. `components/tool/Phase3/SolarConfigurator.tsx` — Zonnepanelen dakwerk (voorbereidend werk, doorvoeren, bevestiging types)
>
> Each calls `onItemsChange(items: LineItem[])`. Apply margins via `applyMargins()` from `lib/pricing.ts`. All per spec. "use client" TypeScript.

**Brief for Subagent D3 — Equipment, Custom Items, Price Footer, Discount, Payment Terms:**
> You are building Phase 3 utility components for a quote tool. Project: `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` and `pricing.json` first.
>
> Build:
> 1. `components/tool/Phase3/EquipmentRentals.tsx` — loads all equipment from `pricing.json`. Per item: toggle on/off, duration input (days or weeks). Price computed. Calls `onItemsChange(items: LineItem[])`. Phase 2 margins apply to equipment.
> 2. `components/tool/Phase3/InsulationConfigurator.tsx` — standalone isolatie category (type, dikte, m², damprem).
> 3. `components/tool/Phase3/OtherWorkConfigurator.tsx` — Overig: dakcoating/reiniging, vogelwering.
> 4. `components/tool/Phase3/CustomItems.tsx` — "+ Eigen post toevoegen" button, inline form: omschrijving + bedrag (ex BTW) + BTW tarief (21%/9%/0%). List of added items with delete. Phase 2 margins do NOT apply. Calls `onItemsChange(items: LineItem[])`.
> 5. `components/tool/Phase3/PriceFooter.tsx` — fixed bottom bar. Props: `allItems: LineItem[]`, `discount: number` (0–0.05), `margins`. Computes and displays: Subtotaal ex BTW | BTW | Korting (if >0) | **Totaal incl. BTW**. Also contains "Offerte afronden →" button that calls `onFinalize()` prop.
> 6. `components/tool/Phase3/DiscountSelector.tsx` — tap buttons 0%/1%/2%/3%/4%/5%, calls `onChange(value: number)`.
> 7. `components/tool/Phase3/PaymentTerms.tsx` — editable textarea, pre-filled default text, calls `onChange(value: string)`.
>
> "use client" TypeScript.

After D1, D2, D3 complete: verify all components export correctly, LineItem interface is consistent across all.

### Step 5 — Spawn Subagent E: Phase 3 orchestrator + Checkup system

**Brief for Subagent E:**
> You are assembling Phase 3 and building the checkup system for a quote tool. Project: `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` first. All sub-components already exist in `components/tool/Phase3/`.
>
> Build:
> 1. `components/tool/Phase3/index.tsx` — Phase 3 main orchestrator. Renders in order: CustomerInfo → BuildingInfo → RoofConfigurator (tabs/accordion for all roof categories) → EquipmentRentals → CustomItems → DiscountSelector → PaymentTerms → PriceFooter (fixed). Collects all `LineItem[]` from sub-components into a master `allItems` array. Passes margins down. When "Offerte afronden →" is tapped, calls `onReadyForCheckup(quoteState)` prop.
> 2. `components/tool/Phase3/CustomerInfo.tsx` — form fields: Naam*, Adres*, Postcode*, Stad*, Telefoon*, Email. Validation.
> 3. `components/tool/Phase3/BuildingInfo.tsx` — Aantal verdiepingen (stepper), Gebouwtype (select), Bereikbaarheid (select), Notities (textarea).
> 4. `components/tool/CheckupPopups.tsx` — modal-based checkup sequence. Accepts `quoteState` and `onAddItem(item: LineItem)` and `onComplete()`. Runs all 7 checks from spec in sequence. Each check: evaluate condition → show modal → "Ja" adds item + returns user to Phase 3 (calls a `onReturnToPhase3()` prop) → "Nee" advances to next check. After all pass: calls `onComplete()`.
>
> "use client" TypeScript.

After E completes: verify Phase 3 renders all sub-configurators, checkup logic is correct.

### Step 6 — Spawn Subagent F: Phase 4 + API routes

**Brief for Subagent F:**
> You are building Phase 4 (Review & Output) and the API routes for a quote tool. Project: `/home/tim/Desktop/Dakservice VanHeijst/dakservice-van-heijst`. Read `QUOTE_TOOL_SPEC.md` first. `lib/pdfGenerator.ts`, `lib/quoteStorage.ts` already exist.
>
> Build:
> 1. `components/tool/Phase4Review.tsx`
>    - Customer-facing quote summary (clean, professional)
>    - Itemized table: omschrijving | eenheid | aantal | prijs p/e | totaal
>    - Subtotaal / BTW / Klantkorting (if >0, shown as line item) / **Totaal incl. BTW**
>    - Betalingsvoorwaarden block
>    - Handtekening block (two columns)
>    - Language selector (NL/EN/ES) as prominent button group before output actions
>    - "PDF Genereren" → calls `generatePDF()`, triggers browser download
>    - "Per e-mail versturen" → modal for customer email input → POST to `/api/tool/send-quote`
>    - "Nieuwe offerte" → confirm dialog → calls `onReset()` prop
>    - On mount: POST to `/api/tool/quotes` to save quote and receive quote ID
>    - Display quote ID prominently
>
> 2. `app/api/tool/quotes/route.ts`
>    - POST: accepts quote JSON body, calls `saveQuote()` from `lib/quoteStorage.ts`, returns `{ id: "DRE-2026-001" }`
>    - GET: returns all quotes from `lib/quoteStorage.ts`
>
> 3. `app/api/tool/send-quote/route.ts`
>    - POST: accepts `{ pdfBase64: string, customerEmail: string, quoteId: string }`
>    - Uses nodemailer (same transporter pattern as `app/api/contact/route.ts`)
>    - Sends PDF as attachment to customerEmail
>    - CC's to `process.env.SMTP_TO`
>    - Subject: `"Offerte ${quoteId} — Dutch Roofing Experts"`
>
> "use client" for Phase4Review. TypeScript throughout.

After F completes: verify API routes are correct, Phase 4 renders properly.

### Step 7 — You (manager) integrate and wire everything

Now YOU (not a subagent) do the integration:

1. Update `app/tool/page.tsx` to properly wire all phase transitions:
   - Phase 1 `onLogin` → set employee, advance to Phase 2
   - Phase 2 `onComplete` → set margins, advance to Phase 3
   - Phase 3 `onReadyForCheckup` → save quoteState, render CheckupPopups
   - CheckupPopups `onAddItem` → add to quoteState, return to Phase 3
   - CheckupPopups `onComplete` → advance to Phase 4
   - Phase 4 `onReset` → clear all state, back to Phase 1

2. Ensure `PhaseProgress` component is visible in all phases.

3. Ensure `LanguageToggle` is positioned fixed top-right throughout.

4. Verify all TypeScript types are consistent (especially `LineItem`, `QuoteData`, `Margins`).

5. Create shared `types/tool.ts` with all shared interfaces if not already done.

### Step 8 — Final QA (you, the manager)

1. Run `npm run build` or `npx tsc --noEmit` and fix all TypeScript errors.
2. Verify `/tool` is not in `app/sitemap.ts` or `app/robots.ts`.
3. Manually trace through the full flow in your head: login → margins → customer info → select bitumen 50m² → select steiger → checkup → PDF → email.
4. Verify Phase 2 markup math: if material +20% and universal +10%, a €100 material item should be €100 × 1.2 × 1.1 = €132. Customer sees €132, not €100.
5. Verify discount stacks last: €132 with 5% discount = €132 × 0.95 = €125.40, and "Klantkorting -5%" appears as line item on PDF.
6. Verify custom items are exempt from Phase 2 margins.
7. Verify employee name is NEVER in the PDF or Phase 4 customer view.
8. Check all 7 checkup conditions trigger correctly.

---

## Critical Rules

- **Read the spec before coding.** `QUOTE_TOOL_SPEC.md` has all the detail.
- **Do not break the existing site.** `/tool` is additive. Touch no existing files except to exclude `/tool` from sitemap/robots.
- **Phase 2 markup is sacred.** It must never appear in any customer-facing output. Apply silently, show only final prices.
- **Mobile-first.** Employees use iPads and phones. Minimum 48px tap targets everywhere.
- **All prices from `pricing.json`.** No hardcoded prices in components.
- **Subagents have no shared memory.** Give each a complete brief. Do not assume they know what another subagent did.
- **Verify before proceeding.** Read subagent output before running dependent stages.
- **TypeScript strictly.** No `any` types unless absolutely unavoidable.

## Files to Read First (as manager)

1. `QUOTE_TOOL_SPEC.md`
2. `QUOTE_TOOL_TODO.md`
3. `app/page.tsx`
4. `app/layout.tsx`
5. `app/api/contact/route.ts`
6. `package.json`
7. `data/content.json`

Begin now. Start with Step 1 (read all files), then proceed through the execution plan in order.
