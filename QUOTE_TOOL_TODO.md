# Quote Tool — TODO List

All tasks reference `QUOTE_TOOL_SPEC.md` for detail. Check off as completed.

---

## Stage 0 — Foundation (do first, everything depends on this)

- [ ] **0.1** Install dependencies: `jspdf`, `jspdf-autotable`, `nodemailer` (already installed — verify)
- [ ] **0.2** Create `pricing.json` in project root — full Alicante/Valencia price data for ALL categories, all items, all options, equipment rentals. Include `enabled` flags everywhere. See spec for structure.
- [ ] **0.3** Create `/data/quotes.json` — empty quotes store `{ "lastNumber": 0, "quotes": [] }`
- [ ] **0.4** Create `lib/pricing.ts` — loads `pricing.json`, exports typed interfaces, applies Phase 2 margin multipliers to base prices
- [ ] **0.5** Create `lib/quoteStorage.ts` — read/write `/data/quotes.json`, generate quote numbers (`DRE-YYYY-NNN`)
- [ ] **0.6** Create `lib/pdfGenerator.ts` — jsPDF wrapper, accepts quote data + language, returns PDF blob
- [ ] **0.7** Create `app/tool/layout.tsx` — strips site navbar/footer, clean blank layout for the tool
- [ ] **0.8** Create `app/tool/page.tsx` — phase state machine (`phase: 1 | 2 | 3 | 4`), holds all quote state, renders correct phase component

---

## Stage 1 — Phase 1: Login

- [ ] **1.1** Create `components/tool/Phase1Login.tsx`
  - Full-screen, centered, company logo
  - 4-digit PIN input (large, mobile-friendly, number keyboard)
  - Employee map: `{ "0404": "Laurens van Heijst", "2501": "Tim van Heijst" }`
  - On correct code: store employee name in sessionStorage, advance to Phase 2
  - On wrong code: red error message, clear input
- [ ] **1.2** Add phase progress indicator component (shows 1-2-3-4, used across all phases)

---

## Stage 2 — Phase 2: Margin Pre-Set

- [ ] **2.1** Create `components/tool/Phase2Margins.tsx`
  - 3 rows: Materiaalkosten / Uurtarief / Alles
  - Per row: button group [+0%] [+10%] [+20%] [+30%] [+40%] [+50%]
  - Active button highlighted gold, inactive dark
  - Brief explanation text (employee-only, not shown to customer)
  - "Doorgaan →" button, saves margins to parent state
- [ ] **2.2** Stacking logic documented in state: `margins = { material: 1.2, labor: 1.0, universal: 1.1 }` (multipliers)

---

## Stage 3 — Phase 3: Quote Builder

### 3a. Customer Info
- [ ] **3.1** Create `components/tool/Phase3/CustomerInfo.tsx`
  - Fields: Naam*, Adres*, Postcode*, Stad*, Telefoon*, Email
  - Required fields marked, validation on submit
  - Clean card layout

### 3b. Building Info
- [ ] **3.2** Create `components/tool/Phase3/BuildingInfo.tsx`
  - Aantal verdiepingen (number stepper 1–10+)
  - Gebouwtype (select: Villa / Appartement / Commercieel / Industrieel / Anders)
  - Bereikbaarheid (select: Goed / Lastig / Zeer moeilijk)
  - Notities (textarea)

### 3c. Roof Configurator
- [ ] **3.3** Create `components/tool/Phase3/RoofConfigurator.tsx` — category accordion/tab list, loads from `pricing.json`
- [ ] **3.4** Build **Plat Dak** sub-configurator (bitumen, EPDM, grind, liquid coating) — all spec options
- [ ] **3.5** Build **Pannendak** sub-configurator (beton, keramisch, leien, metaal) — all spec options
- [ ] **3.6** Build **Goten & Afwatering** sub-configurator
- [ ] **3.7** Build **Schoorsteen & Nokwerk** sub-configurator
- [ ] **3.8** Build **Dakramen & Lichtkoepels** sub-configurator
- [ ] **3.9** Build **Zonnepanelen (dakwerk)** sub-configurator
- [ ] **3.10** Build **Isolatie** sub-configurator
- [ ] **3.11** Build **Overig dakwerk** sub-configurator (coating, vogelwering)
- [ ] **3.12** Each sub-configurator: inputs update line items in parent state with computed price (base × margin multipliers)

### 3d. Equipment Rentals
- [ ] **3.13** Create `components/tool/Phase3/EquipmentRentals.tsx`
  - List all equipment items from `pricing.json`
  - Per item: toggle on/off, duration input (days or weeks)
  - Price computed and added to running total

### 3e. Custom Line Items
- [ ] **3.14** Create `components/tool/Phase3/CustomItems.tsx`
  - "+ Eigen post toevoegen" button
  - Inline form: omschrijving + bedrag (ex BTW) + BTW tarief (21%/9%/0%)
  - List of added custom items with delete button
  - Phase 2 margins do NOT apply to custom items

### 3f. Discount + Payment Terms
- [ ] **3.15** Create `components/tool/Phase3/DiscountSelector.tsx`
  - Tap buttons: 0% / 1% / 2% / 3% / 4% / 5%
  - Applied after all other calculations

- [ ] **3.16** Create `components/tool/Phase3/PaymentTerms.tsx`
  - Pre-filled editable textarea
  - Default: "50% aanbetaling voor aanvang werkzaamheden, 50% na oplevering."

### 3g. Persistent Price Footer
- [ ] **3.17** Create `components/tool/Phase3/PriceFooter.tsx`
  - Fixed to bottom of viewport during Phase 3
  - Shows: Subtotaal ex BTW | BTW 21% | Korting -X% | **Totaal incl. BTW**
  - Updates live on every state change
  - "Offerte afronden →" button in footer to trigger checkups

### 3h. Phase 3 Main Orchestrator
- [ ] **3.18** Create `components/tool/Phase3/index.tsx` — assembles all sub-components in order, manages Phase 3 state

---

## Stage 4 — Smart Checkup Popups

- [ ] **4.1** Create `components/tool/CheckupPopups.tsx`
  - Runs through checkup conditions in sequence (see spec for full list)
  - Modal dialog: question + "Ja, toevoegen" + "Nee, doorgaan"
  - "Ja" → adds item to state, closes modal, returns to Phase 3
  - "Nee" → advances to next check
  - All checks passed → emit event to advance to Phase 4
- [ ] **4.2** Implement all 7 checkup conditions from spec

---

## Stage 5 — Phase 4: Review & Output

- [ ] **5.1** Create `components/tool/Phase4Review.tsx`
  - Clean quote summary (customer-facing display)
  - All line items in table: omschrijving | eenheid | aantal | prijs p/e | totaal
  - Subtotaal / BTW / Korting / Totaal breakdown
  - Betalingsvoorwaarden block
  - Handtekening placeholder block
- [ ] **5.2** Language selector modal (NL / EN / ES) before generating PDF
- [ ] **5.3** "PDF Genereren" button → calls `lib/pdfGenerator.ts`, triggers download
- [ ] **5.4** "Per e-mail versturen" button → email input modal → POST to API
- [ ] **5.5** "Nieuwe offerte" button → confirm dialog → resets all state, back to Phase 1

---

## Stage 6 — PDF Generator

- [ ] **6.1** Implement `lib/pdfGenerator.ts`
  - Uses jsPDF + jspdf-autotable
  - Full layout per spec (logo, header, klantgegevens, itemtabel, totalen, betalingsvoorwaarden, handtekeningen)
  - Accepts language param (nl/en/es), translates all labels
  - Company colors: dark header, gold accents
  - Returns `Blob` for download or email attachment
- [ ] **6.2** Add translation strings for all PDF labels in NL/EN/ES

---

## Stage 7 — API Routes

- [ ] **7.1** Create `app/api/tool/quotes/route.ts`
  - POST: save quote to `/data/quotes.json`, return `{ id: "DRE-2026-001" }`
  - GET: return all saved quotes (for reference)
- [ ] **7.2** Create `app/api/tool/send-quote/route.ts`
  - POST: accepts `{ pdf: base64, customerEmail, quoteName }`
  - Sends email via nodemailer with PDF attachment
  - CC to `SMTP_TO` (company always gets a copy)

---

## Stage 8 — Polish & QA

- [ ] **8.1** UI language toggle (NL/EN) in top-right throughout all phases
- [ ] **8.2** Phase progress indicator visible in all phases (1 → 2 → 3 → 4)
- [ ] **8.3** Mobile/iPad optimization — all tap targets min 48px, no hover-only interactions, test portrait + landscape
- [ ] **8.4** Ensure `/tool` is excluded from sitemap (`app/sitemap.ts`)
- [ ] **8.5** Ensure `/tool` is excluded from robots.txt (`app/robots.ts`)
- [ ] **8.6** Loading states on all async actions (save, email send)
- [ ] **8.7** Error handling: failed email send, failed save, PDF generation error
- [ ] **8.8** Test full flow end-to-end: login → margins → quote → checkups → PDF download → email send
- [ ] **8.9** Verify Phase 2 markups are never exposed in Phase 3 footer or Phase 4 display
- [ ] **8.10** Verify all stacking math: base → material margin → labor margin → universal margin → customer discount

---

## Dependency Order

```
0 (foundation) → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

Can parallelize:
  - 3.4–3.11 (sub-configurators) in parallel
  - 6 (PDF) in parallel with 5 (Phase 4 UI)
  - 7 (API routes) in parallel with 5+6
```
