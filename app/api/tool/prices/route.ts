import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PRICING_FILE = path.join(process.cwd(), 'pricing.json');

type PricingJson = {
  labor: { baseHourlyRate: number; enabled: boolean };
  categories: Array<{
    id: string;
    items: Array<{ id: string; basePrice: number; [k: string]: unknown }>;
    [k: string]: unknown;
  }>;
  equipment: Array<{ id: string; basePrice: number; [k: string]: unknown }>;
  [k: string]: unknown;
};

function read(): PricingJson {
  return JSON.parse(fs.readFileSync(PRICING_FILE, 'utf-8')) as PricingJson;
}

export async function GET() {
  try {
    const data = read();
    const items: { key: string; basePrice: number }[] = [];

    for (const cat of data.categories) {
      for (const item of cat.items) {
        items.push({ key: `${cat.id}/${item.id}`, basePrice: item.basePrice });
      }
    }
    for (const item of data.equipment) {
      items.push({ key: `equipment/${item.id}`, basePrice: item.basePrice });
    }

    return NextResponse.json({ laborRate: data.labor.baseHourlyRate, items });
  } catch {
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      laborRate?: number;
      items?: Record<string, number>;
    };

    const data = read();

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

    fs.writeFileSync(PRICING_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
}
