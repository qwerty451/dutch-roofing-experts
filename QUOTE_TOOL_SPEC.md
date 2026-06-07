# Dutch Roofing Experts — Quote Tool Specification

## Purpose

An internal, hidden, password-protected web tool accessible at `/tool`. Employees use this on-site with customers (iPad/phone) to build and generate professional quotes in real time, replacing the manual post-visit quote process.

---

## Tech Stack

- **Framework:** Next.js (App Router) — existing project
- **Styling:** Tailwind CSS — match site color scheme (bg-black, `#cc0000` red, `#d4af37` gold)
- **PDF:** `jsPDF` + `jspdf-autotable` (client-side, no server needed)
- **Email:** nodemailer via existing Gmail SMTP (`SMTP_USER` / `SMTP_PASS` / `SMTP_TO` env vars)
- **Storage:** File-based JSON (`/data/quotes.json`) for quote persistence + sequential numbering. **Note:** Vercel filesystem is ephemeral — production needs Vercel KV or Supabase upgrade.
- **Pricing data:** `pricing.json` in project root — all base prices, enable/disable flags per item and category

---

## Authentication

**Route:** `/tool` — not linked anywhere on the main site, not in sitemap, not in nav.

**Employees:**
| Code | Name |
|------|------|
| 0404 | Laurens van Heijst |
| 2501 | Tim van Heijst |

Employee session stored in `sessionStorage`. Wrong code shows error. No attempt limit.

The active employee name is tracked internally throughout the session but **never shown to the customer** and **never appears on the PDF**.

---

## Phase 1 — Login

Full-screen pin entry screen with:
- Dutch Roofing Experts logo (centered)
- 4-digit code input (large, mobile-friendly)
- Submit button
- Error state for wrong code
- On success: transition to Phase 2

---

## Phase 2 — Margin Pre-Set (Hidden Upcharge)

**Shown only to the employee, never to the customer or on the PDF.**

Employee can set independent upcharge multipliers for 3 categories before starting the quote:

| Category | Options |
|----------|---------|
| Materiaalkosten | +0% / +10% / +20% / +30% / +40% / +50% |
| Uurtarief per medewerker | +0% / +10% / +20% / +30% / +40% / +50% |
| Alles (universeel) | +0% / +10% / +20% / +30% / +40% / +50% |

- Each row is independent (tap to toggle, one value active per row)
- "Alles" applies on top of the other two (stacks)
- The 1–5% end-of-Phase-3 customer discount also stacks on top of all margins
- **Stacking order:** base price → material margin → labor margin → universal margin → customer discount

UI: Large tap targets, brief explanation text ("Pas de marges aan op basis van de klant"), continue button.

---

## Phase 3 — Quote Builder

### 3a. Customer Information (shown first)

| Field | Required |
|-------|----------|
| Naam | Yes |
| Adres | Yes |
| Postcode + Stad | Yes |
| Telefoonnummer | Yes |
| E-mailadres | No |

### 3b. Building Information

| Field | Type |
|-------|------|
| Aantal verdiepingen | Number (1–10+) |
| Gebouwtype | Select: Villa / Appartement / Commercieel / Industrieel / Anders |
| Bereikbaarheid dak | Select: Goed bereikbaar / Lastig bereikbaar / Zeer moeilijk (geen oprit/lift) |
| Bijzonderheden / notities | Free text |

---

### 3c. Roof Configurator

All categories and items loaded from `pricing.json`. Categories with `enabled: false` are hidden entirely.

#### Category: Plat Dak
- **Bitumen**
  - m² input
  - Lagen: 1-laags / 2-laags / 3-laags
  - Kwaliteit: Standaard / SBS Gemodificeerd / APP Gemodificeerd
  - Dikte: 3mm / 4mm / 5mm
  - Afwerking: Zand / Leisteen / Alu-folie
  - Isolatie meenemen? Yes/No → if yes: dikte (60/80/100/120mm), type (EPS/PIR/PUR)
  - Dakbedekking verwijderen eerst? Yes/No → adds labour + afvoerkosten

- **EPDM (Rubber dak)**
  - m² input
  - Dikte: 1.0mm / 1.2mm / 1.5mm
  - Bevestiging: Gelijmd / Mechanisch / Ballast
  - Isolatie meenemen? (same as above)
  - Oude bedekking verwijderen? Yes/No

- **Grind / Ballastdak**
  - m² input
  - Grindlaag dikte: standaard / extra dik
  - Vlieslaag vernieuwen? Yes/No

- **Liquid roofing / coating**
  - m² input
  - Type: Polyurethaan / PMMA acrylaat
  - Aantal lagen: 1 / 2 / 3

#### Category: Pannendak
- **Betonpannen**
  - m² input (system auto-calculates approx number of tiles)
  - Werkzaamheid: Volledig vervangen / Gedeeltelijk repareren / Losse pannen vervangen
  - Nokvorsten meenemen? Yes/No → if yes: aantal strekkende meters
  - Windveren vervangen? Yes/No → aantal
  - Dakgoten meenemen? Yes/No (links to goten category)
  - Folie + lat + regelwerk vernieuwen? Yes/No

- **Keramische pannen**
  - Same fields as betonpannen
  - Extra optie: Type profiel (Romaans / Vlak / Golf)

- **Leien dak**
  - m² input
  - Soort: Natuurleien / Kunststof
  - Dikte / formaat: Standaard / Groot formaat
  - Bevestiging: Spijkers / Haken / Dubbelgedekt

- **Metaaldak / Staande naad**
  - m² input
  - Materiaal: Zink / Titaanzink / Aluminium / Cortenstaal
  - Isolatie meenemen? Yes/No

#### Category: Goten & Afwatering
- **Dakg oten**
  - Soort: PVC / Zink / Aluminium / Koper
  - Strekkende meters input
  - Werkzaamheid: Nieuw plaatsen / Vervangen / Reinigen / Repareren
  - Hemelwaterafvoeren (HWA): aantal

- **Zinken goten (maatwerkgoten)**
  - Strekkende meters input
  - Op maat gemaakt? Yes/No

- **Inwendige waterafvoer**
  - Aantal afvoerpunten
  - Type: PVC / HDPE

#### Category: Schoorsteen & Nokwerk
- **Schoorsteen**
  - Voegen bijwerken (m²)
  - Loodwerk vervangen: Yes/No → strekkende meters
  - Schoorsteenkap plaatsen/vervangen: Yes/No → type (RVS / Alu / Keramisch)
  - Schoorsteenveger: Yes/No

- **Nokvorsten / nokafdichting**
  - Strekkende meters
  - Werkzaamheid: Voegen / Vervangen / Nokpannen vervangen
  - Type afdichting: Traditioneel / Ventilerend systeem

- **Kilgoten / dakvoeten (loodwerk)**
  - Strekkende meters
  - Materiaal: Lood / Zink / Aluminium

#### Category: Dakramen & Lichtkoepels
- **Velux / dakraam**
  - Aantal
  - Maat: Standaard (55x78) / Middel (78x118) / Groot (114x118) / Op maat
  - Werkzaamheid: Nieuw plaatsen / Vervangen / Afdichten / Onderhoud
  - Rolluik/zonwering meenemen? Yes/No

- **Lichtkoepel**
  - Aantal
  - Maat: 60x60 / 80x80 / 100x100 / Op maat
  - Type: Enkel / Dubbel / Triple HR
  - Ventilerend? Yes/No
  - Inclusief opstand (opstort): Yes/No

- **Dakdoorvoeren**
  - Aantal
  - Type: Ventilatiedoorvoer / Elektra / Data / Warmtepomp

#### Category: Zonnepanelen (gerelateerd dakwerk)
- **Dakvoorbereiding zonnepanelen**
  - Aantal panelen (input)
  - Dakconstructie versterken: Yes/No
  - Waterdichte doorvoeren plaatsen: aantal
  - Type bevestiging: Op pannen / Op folie / Ballastsysteem plat dak

- **Dakinspectie voor solar**
  - m² input (vlak inspectiegebied)
  - Rapportage gewenst? Yes/No

#### Category: Isolatie (los)
- **Dakisolatie**
  - m² input
  - Type: EPS / PIR / PUR / Glaswol / Rockwool
  - Dikte: 60 / 80 / 100 / 120 / 140 / 160mm
  - Damprem/dampscherm meenemen? Yes/No

#### Category: Overig dakwerk
- **Dakcoating / dakreiniging**
  - m² input
  - Werkzaamheid: Reiniging / Anti-mosbehandeling / Coating

- **Vogelwering**
  - Strekkende meters
  - Type: Pennen / Net / Spikes

---

### 3d. Equipment & Rentals

All from `pricing.json`, unit = per dag / per week:

| Item | Unit | Notes |
|------|------|-------|
| Container huur | per dag | 6m³ / 10m³ / 20m³ keuze |
| Steiger huur | per week | Aantal steigervakken input |
| Pannenlift huur | per dag | |
| Hoogwerker huur | per dag | Hoogte: 12m / 18m / 24m |
| Aanhangwagen | per dag | |
| Veiligheidslijn systeem | per dag | |
| Dakbeschermingsmateriaal (loopplanken etc.) | per dag | |

Duration input (number of days/weeks) per item selected.

---

### 3e. Custom Line Items

Button: **"+ Eigen post toevoegen"**

Opens inline form:
- Omschrijving (text)
- Bedrag (number, excl. BTW)
- BTW tarief: 21% / 9% / 0%

Unlimited items. Each shows in the running total and the final PDF. Phase 2 margins do NOT apply to custom items (they are already manually priced by the employee).

---

### 3f. Discount Selector

Visible to employee. Shown as line item on PDF ("Klantkorting").

Options: **0% / 1% / 2% / 3% / 4% / 5%** (tap to select, 0% default)

Applied after all Phase 2 margins. Stacks on top.

---

### 3g. Payment Terms

Editable text field, pre-filled with:
> "50% aanbetaling voor aanvang werkzaamheden, 50% na oplevering."

Employee can modify freely. Appears on PDF.

---

### 3h. Persistent Price Footer

Always visible at bottom of screen during Phase 3. Updates live.

```
[ Subtotaal ex. BTW: €X.XXX,XX ]  [ BTW 21%: €XXX,XX ]  [ Totaal incl. BTW: €X.XXX,XX ]
```

Phase 2 markup is silently included. Customer discount shown separately above footer as "Korting: -X%".

---

## Phase 3 → Phase 4: Smart Checkup Popups

Triggered in sequence before proceeding to Phase 4. Employee taps "Offerte afronden →" to start.

| Condition | Popup text | If Yes | If No |
|-----------|-----------|--------|-------|
| Verdiepingen ≥ 2 AND geen steigers/hoogwerker | "Je hebt X verdiepingen opgegeven maar geen steigers of hoogwerker toegevoegd. Wil je dit alsnog toevoegen?" | Opens equipment section, returns to Phase 3 | Next check |
| Pannendak selected AND geen pannenlift | "Er is een pannendak geselecteerd maar geen pannenlift. Toevoegen?" | Adds pannenlift (1 dag), returns to Phase 3 | Next check |
| Groot volume materiaal AND geen container | "Je hebt veel materiaal geselecteerd. Wil je een container toevoegen?" | Opens equipment section | Next check |
| EPDM/bitumen AND geen primer/lijmkosten in custom items | "Heb je lijm/primer kosten meegenomen?" | Returns to Phase 3 | Next check |
| Schoorsteenwerk AND geen loodwerk | "Heb je loodwerkkosten meegenomen bij het schoorsteenwerk?" | Returns to Phase 3 | Next check |
| Zonnepanelen AND geen dakdoorvoeren | "Wil je waterdichte dakdoorvoeren toevoegen?" | Adds item | Next check |
| Bereikbaarheid = Zeer moeilijk AND geen hoogwerker/steigers | "Bereikbaarheid is als moeilijk gemarkeerd. Extra materieel toegevoegd?" | Returns to Phase 3 | Next check |

After all checks pass → Phase 4.

---

## Phase 4 — Review & Output

### Quote Summary View

Clean, customer-facing display:
- Dutch Roofing Experts header (logo, contact info)
- Offerte nummer (e.g. `DRE-2026-001`)
- Datum + geldig tot (14 dagen)
- Klantgegevens
- Itemized table: omschrijving | eenheid | aantal | prijs p/e | totaal
- Subtotaal ex BTW
- BTW (21%)
- Klantkorting (if >0%): -X%
- **Totaal incl. BTW** (bold, large)
- Betalingsvoorwaarden
- Handtekeningblok (klant + medewerker)

**Phase 2 markups are never shown — only final computed prices appear.**

### Language Selection

Before generating PDF:
> "In welke taal wilt u de offerte genereren?"
> [ Nederlands ] [ English ] [ Español ]

All PDF labels translate. Item names translate if available in `pricing.json`, otherwise fallback to NL.

### Output Actions

1. **PDF Genereren** → client-side jsPDF, download as `offerte-DRE-2026-001.pdf`
2. **Per e-mail versturen** → input field for customer email → POST to `/api/tool/send-quote` → nodemailer sends PDF as attachment
3. **Nieuwe offerte** → clears state, back to Phase 1

---

## PDF Layout Specification

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]    Dutch Roofing Experts                     │
│            Tel: +31 6 45577172                       │
│            dutchroofingexperts@yahoo.com             │
│            Costa Blanca South                        │
├─────────────────────────────────────────────────────┤
│  OFFERTE                          Nr: DRE-2026-001   │
│  Datum: 07-06-2026                                   │
│  Geldig tot: 21-06-2026 (14 dagen)                   │
├─────────────────────────────────────────────────────┤
│  Klant:                                              │
│  [Naam]                                              │
│  [Adres, Postcode Stad]                              │
│  [Tel] [Email]                                       │
├─────────────────────────────────────────────────────┤
│  Omschrijving          Eenheid  Aantal  P/E   Totaal │
│  ─────────────────────────────────────────────────  │
│  [line items...]                                     │
│  ─────────────────────────────────────────────────  │
│  Subtotaal ex. BTW                         €X.XXX   │
│  BTW 21%                                   €  XXX   │
│  Klantkorting (X%)                         - € XXX  │
│  TOTAAL INCL. BTW                          €X.XXX   │
├─────────────────────────────────────────────────────┤
│  Betalingsvoorwaarden:                               │
│  [payment terms text]                                │
├─────────────────────────────────────────────────────┤
│  Handtekening klant:         Handtekening bedrijf:  │
│  ____________________        ____________________   │
│  Datum: ___________          Dutch Roofing Experts  │
└─────────────────────────────────────────────────────┘
```

---

## pricing.json Structure

```json
{
  "meta": {
    "region": "Alicante/Valencia, Spain",
    "currency": "EUR",
    "vatRate": 0.21,
    "lastUpdated": "2026-06-07"
  },
  "labor": {
    "baseHourlyRate": 45,
    "enabled": true
  },
  "categories": [
    {
      "id": "flat_roof",
      "enabled": true,
      "name": { "nl": "Plat Dak", "en": "Flat Roof", "es": "Tejado Plano" },
      "items": [
        {
          "id": "bitumen",
          "enabled": true,
          "name": { "nl": "Bitumen dakbedekking", "en": "Bitumen roofing", "es": "Cubierta de bitumen" },
          "unit": "m²",
          "basePrice": 38,
          "options": { ... }
        }
      ]
    }
  ],
  "equipment": [
    {
      "id": "container_small",
      "enabled": true,
      "name": { "nl": "Container huur 6m³", "en": "Skip hire 6m³", "es": "Alquiler contenedor 6m³" },
      "unit": "dag",
      "basePrice": 95
    }
  ]
}
```

---

## Quote Storage

**File:** `/data/quotes.json`
**Format:**
```json
{
  "lastNumber": 4,
  "quotes": [
    {
      "id": "DRE-2026-001",
      "date": "2026-06-07",
      "employee": "Laurens van Heijst",
      "customer": { "name": "...", "address": "..." },
      "totals": { "subtotal": 3200, "vat": 672, "discount": 0.05, "total": 3686 },
      "language": "nl"
    }
  ]
}
```

---

## Design Rules

- Background: `bg-black` / `bg-gray-950`
- Accent red: `#cc0000`
- Accent gold: `#d4af37`
- Font: same as site (system/next font)
- Buttons: large, min 48px height (mobile/iPad touch)
- No site navbar or footer on `/tool` route
- Phase progress indicator at top (1 → 2 → 3 → 4)
- UI language toggle (NL / EN) in top-right corner throughout

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tool/quotes` | POST | Save quote, return quote number |
| `/api/tool/quotes` | GET | List all quotes (optional admin use) |
| `/api/tool/send-quote` | POST | Email PDF to customer |
