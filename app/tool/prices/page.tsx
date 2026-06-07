import PricesEditor from './PricesEditor';
import pricingData from '../../../pricing.json';

export default function PricesPage() {
  const sections: { id: string; label: string; items: { key: string; name: string; unit: string; basePrice: number }[] }[] = [];

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

  for (const cat of pricingData.categories) {
    sections.push({
      id: cat.id,
      label: CAT_LABELS[cat.id] ?? cat.id,
      items: cat.items.map((item) => ({
        key: `${cat.id}/${item.id}`,
        name: item.name.nl,
        unit: item.unit,
        basePrice: item.basePrice,
      })),
    });
  }

  sections.push({
    id: 'equipment',
    label: 'Materieel & Verhuur',
    items: pricingData.equipment.map((item) => ({
      key: `equipment/${item.id}`,
      name: item.name.nl,
      unit: item.unit,
      basePrice: item.basePrice,
    })),
  });

  return (
    <PricesEditor
      laborRate={pricingData.labor.baseHourlyRate}
      sections={sections}
    />
  );
}
