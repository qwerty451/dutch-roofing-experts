import fs from 'fs';
import path from 'path';
import type { PricingData } from './pricing';

export function loadPricing(): PricingData {
  const filePath = path.join(process.cwd(), 'pricing.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as PricingData;
}
