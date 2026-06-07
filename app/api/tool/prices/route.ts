import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BUNDLED_FILE = path.join(process.cwd(), 'pricing.json');
const TMP_FILE = path.join('/tmp', 'pricing.json');

type PricingJson = {
  labor: { baseHourlyRate: number; enabled: boolean };
  categories: Array<{
    id: string;
    items: Array<{ id: string; name: { nl: string }; unit: string; basePrice: number; [k: string]: unknown }>;
    [k: string]: unknown;
  }>;
  equipment: Array<{ id: string; name: { nl: string }; unit: string; basePrice: number; [k: string]: unknown }>;
  [k: string]: unknown;
};

const CAT_LABELS: Record<string, string> = {
  flat_roof: 'Plat Dak',
  pitched_roof: 'Pannendak',
  gutters: 'Goten',
  chimney: 'Schoorsteen',
  skylights: 'Dakramen',
  solar_prep: 'Zonnepanelen',
  insulation: 'Isolatie',
  other_work: 'Overig',
  emergency: 'Spoedreparaties',
};

function readPricing(): PricingJson {
  // Prefer /tmp version (runtime-edited) over the bundled file
  const src = fs.existsSync(TMP_FILE) ? TMP_FILE : BUNDLED_FILE;
  return JSON.parse(fs.readFileSync(src, 'utf-8')) as PricingJson;
}

function writePricing(data: PricingJson): void {
  const json = JSON.stringify(data, null, 2);
  // Try project root first (works on local server), fall back to /tmp (works on Vercel)
  try {
    fs.writeFileSync(BUNDLED_FILE, json, 'utf-8');
  } catch {
    fs.writeFileSync(TMP_FILE, json, 'utf-8');
  }
}

export async function GET() {
  try {
    const data = readPricing();

    const sections = data.categories.map((cat) => ({
      id: cat.id,
      label: CAT_LABELS[cat.id] ?? cat.id,
      items: cat.items.map((item) => ({
        key: `${cat.id}/${item.id}`,
        name: item.name.nl,
        unit: item.unit,
        basePrice: item.basePrice,
      })),
    }));

    sections.push({
      id: 'equipment',
      label: 'Materieel & Verhuur',
      items: data.equipment.map((item) => ({
        key: `equipment/${item.id}`,
        name: item.name.nl,
        unit: item.unit,
        basePrice: item.basePrice,
      })),
    });

    // Also return flat items list for backwards compat
    const items = sections.flatMap((s) => s.items.map((i) => ({ key: i.key, basePrice: i.basePrice })));

    return NextResponse.json({ laborRate: data.labor.baseHourlyRate, sections, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      laborRate?: number;
      items?: Record<string, number>;
    };

    const data = readPricing();

    if (typeof body.laborRate === 'number') {
      data.labor.baseHourlyRate = body.laborRate;
    }

    if (body.items) {
      for (const [key, price] of Object.entries(body.items)) {
        const [catId, itemId] = key.split('/');
        if (catId === 'equipment') {
          const item = data.equipment.find((e) => e.id === itemId);
          if (item) item.basePrice = price;
        } else {
          const cat = data.categories.find((c) => c.id === catId);
          if (cat) {
            const item = cat.items.find((i) => i.id === itemId);
            if (item) item.basePrice = price;
          }
        }
      }
    }

    writePricing(data);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Prices save error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
