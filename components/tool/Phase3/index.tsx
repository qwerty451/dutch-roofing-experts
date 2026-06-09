"use client";

import { useState, useRef, useEffect } from "react";
import type { LineItem, Margins, CustomerInfo, BuildingInfo, Warranty } from "../../../types/tool";

// ---------------------------------------------------------------------------
// Session helpers (Phase 3 form data only — items are not persisted because
// sub-configurators manage their own form state internally)
// ---------------------------------------------------------------------------

const PHASE3_SESSION_KEY = "dre_tool_phase3";

interface Phase3FormSession {
  customer: CustomerInfo;
  building: BuildingInfo;
  discount: number;
  paymentTerms: string;
  activeTab: string;
  warranty?: Warranty;
}

import CustomerInfoForm from "./CustomerInfo";
import BuildingInfoForm from "./BuildingInfo";
import FlatRoofConfigurator from "./FlatRoofConfigurator";
import TiledRoofConfigurator from "./TiledRoofConfigurator";
import GuttersConfigurator from "./GuttersConfigurator";
import ChimneyConfigurator from "./ChimneyConfigurator";
import SkylightsConfigurator from "./SkylightsConfigurator";
import SolarConfigurator from "./SolarConfigurator";
import InsulationConfigurator from "./InsulationConfigurator";
import OtherWorkConfigurator from "./OtherWorkConfigurator";
import SpoedConfigurator from "./SpoedConfigurator";
import EquipmentRentals from "./EquipmentRentals";
import CustomItems from "./CustomItems";
import DiscountSelector from "./DiscountSelector";
import PaymentTerms from "./PaymentTerms";
import PriceFooter from "./PriceFooter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Phase3State {
  customer: CustomerInfo;
  building: BuildingInfo;
  items: LineItem[];
  discount: number;
  paymentTerms: string;
  margins: Margins;
  warranty: Warranty;
}

interface Phase3QuoteProps {
  margins: Margins;
  employee: string; // stored internally, never shown to customer
  language: "nl" | "en";
  onLanguageChange: (lang: "nl" | "en") => void;
  onReadyForCheckup: (quoteState: Phase3State) => void;
  additionalItems?: LineItem[]; // items added externally (e.g. by CheckupPopups)
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId =
  | "flat_roof"
  | "tiled_roof"
  | "gutters"
  | "chimney"
  | "skylights"
  | "solar"
  | "insulation"
  | "other"
  | "spoed";

const TABS: { id: TabId; nl: string; en: string }[] = [
  { id: "flat_roof", nl: "Plat Dak", en: "Flat Roof" },
  { id: "tiled_roof", nl: "Pannendak", en: "Tiled Roof" },
  { id: "gutters", nl: "Goten", en: "Gutters" },
  { id: "chimney", nl: "Schoorsteen", en: "Chimney" },
  { id: "skylights", nl: "Dakramen", en: "Skylights" },
  { id: "solar", nl: "Zonnepanelen", en: "Solar" },
  { id: "insulation", nl: "Isolatie", en: "Insulation" },
  { id: "other", nl: "Overig", en: "Other" },
  { id: "spoed", nl: "Spoed 🚨", en: "Emergency 🚨" },
];

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_CUSTOMER: CustomerInfo = {
  naam: "",
  adres: "",
  postcode: "",
  stad: "",
  telefoon: "",
  email: "",
};

const DEFAULT_BUILDING: BuildingInfo = {
  verdiepingen: 1,
  gebouwtype: "",
  bereikbaarheid: "",
  urgentie: "",
  notities: "",
};

const DEFAULT_PAYMENT_TERMS = {
  nl: "50% aanbetaling voor aanvang werkzaamheden, 50% na oplevering.",
  en: "50% deposit before commencement of works, 50% upon completion.",
} as const;

function loadPhase3Session(): Phase3FormSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PHASE3_SESSION_KEY);
    if (raw) return JSON.parse(raw) as Phase3FormSession;
  } catch {}
  return null;
}

function savePhase3Session(s: Phase3FormSession) {
  try { sessionStorage.setItem(PHASE3_SESSION_KEY, JSON.stringify(s)); } catch {}
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    roofwork: "Dakwerk",
    validationBanner:
      "Vul de verplichte klantgegevens in (naam, adres, telefoon) voordat je de offerte afrondt.",
  },
  en: {
    roofwork: "Roof Work",
    validationBanner:
      "Please fill in the required customer details (name, address, phone) before finalising the quote.",
  },
} as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Phase3Quote({
  margins,
  employee: _employee, // stored but never rendered
  language,
  onLanguageChange: _onLanguageChange,
  onReadyForCheckup,
  additionalItems = [],
}: Phase3QuoteProps) {
  const labels = t[language];

  // -------------------------------------------------------------------------
  // Restore session once on mount
  // -------------------------------------------------------------------------
  const restoredSession = loadPhase3Session();
  const wasRestored = restoredSession !== null;

  // -------------------------------------------------------------------------
  // Customer & building state
  // -------------------------------------------------------------------------
  const [customer, setCustomer] = useState<CustomerInfo>(
    restoredSession?.customer ?? DEFAULT_CUSTOMER
  );
  const [building, setBuilding] = useState<BuildingInfo>(
    restoredSession?.building ?? DEFAULT_BUILDING
  );

  // -------------------------------------------------------------------------
  // Roof configurator item arrays (one per category)
  // These are NOT persisted — sub-configurators manage their own form state.
  // -------------------------------------------------------------------------
  const [flatRoofItems, setFlatRoofItems] = useState<LineItem[]>([]);
  const [tiledRoofItems, setTiledRoofItems] = useState<LineItem[]>([]);
  const [gutterItems, setGutterItems] = useState<LineItem[]>([]);
  const [chimneyItems, setChimneyItems] = useState<LineItem[]>([]);
  const [skylightItems, setSkylightItems] = useState<LineItem[]>([]);
  const [solarItems, setSolarItems] = useState<LineItem[]>([]);
  const [insulationItems, setInsulationItems] = useState<LineItem[]>([]);
  const [otherItems, setOtherItems] = useState<LineItem[]>([]);
  const [spoedItems, setSpoedItems] = useState<LineItem[]>([]);

  // Equipment & custom items
  const [equipmentItems, setEquipmentItems] = useState<LineItem[]>([]);
  const [customItems, setCustomItems] = useState<LineItem[]>([]);

  // -------------------------------------------------------------------------
  // Discount & payment terms
  // -------------------------------------------------------------------------
  const [discount, setDiscount] = useState<number>(
    restoredSession?.discount ?? 0
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    restoredSession?.paymentTerms ?? DEFAULT_PAYMENT_TERMS[language]
  );
  const [warranty, setWarranty] = useState<Warranty>(
    restoredSession?.warranty ?? { enabled: false, period: "2 jaar" }
  );

  // -------------------------------------------------------------------------
  // Tab & validation state
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabId>(
    (restoredSession?.activeTab as TabId) ?? "flat_roof"
  );
  const [validationError, setValidationError] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(wasRestored);

  const topRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Persist form data to sessionStorage on every change
  // -------------------------------------------------------------------------
  useEffect(() => {
    savePhase3Session({ customer, building, discount, paymentTerms, activeTab, warranty });
  }, [customer, building, discount, paymentTerms, activeTab, warranty]);

  // Auto-switch to Spoed tab when urgentie is set to urgent
  useEffect(() => {
    const u = building.urgentie;
    if (u.startsWith("Dringend") || u.startsWith("Spoedreparatie")) {
      setActiveTab("spoed");
    }
  }, [building.urgentie]);

  // -------------------------------------------------------------------------
  // Merged items
  // -------------------------------------------------------------------------
  const allItems: LineItem[] = [
    ...flatRoofItems,
    ...tiledRoofItems,
    ...gutterItems,
    ...chimneyItems,
    ...skylightItems,
    ...solarItems,
    ...insulationItems,
    ...otherItems,
    ...spoedItems,
    ...equipmentItems,
    ...customItems,
    ...additionalItems,
  ];

  // -------------------------------------------------------------------------
  // Finalize handler
  // -------------------------------------------------------------------------
  function handleFinalize() {
    const valid =
      customer.naam.trim() !== "" &&
      customer.adres.trim() !== "" &&
      customer.telefoon.trim() !== "";

    if (!valid) {
      setValidationError(true);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setValidationError(false);

    const state: Phase3State = {
      customer,
      building,
      items: allItems,
      discount,
      paymentTerms,
      margins,
      warranty,
    };

    onReadyForCheckup(state);
  }

  // -------------------------------------------------------------------------
  // Render active configurator
  // -------------------------------------------------------------------------
  function renderConfigurator() {
    const sharedProps = { margins, language };
    switch (activeTab) {
      case "flat_roof":
        return (
          <FlatRoofConfigurator
            {...sharedProps}
            onItemsChange={setFlatRoofItems}
          />
        );
      case "tiled_roof":
        return (
          <TiledRoofConfigurator
            {...sharedProps}
            onItemsChange={setTiledRoofItems}
          />
        );
      case "gutters":
        return (
          <GuttersConfigurator
            {...sharedProps}
            onItemsChange={setGutterItems}
          />
        );
      case "chimney":
        return (
          <ChimneyConfigurator
            {...sharedProps}
            onItemsChange={setChimneyItems}
          />
        );
      case "skylights":
        return (
          <SkylightsConfigurator
            {...sharedProps}
            onItemsChange={setSkylightItems}
          />
        );
      case "solar":
        return (
          <SolarConfigurator
            {...sharedProps}
            onItemsChange={setSolarItems}
          />
        );
      case "insulation":
        return (
          <InsulationConfigurator
            {...sharedProps}
            onItemsChange={setInsulationItems}
          />
        );
      case "other":
        return (
          <OtherWorkConfigurator
            {...sharedProps}
            onItemsChange={setOtherItems}
          />
        );
      case "spoed":
        return (
          <SpoedConfigurator
            {...sharedProps}
            urgentie={building.urgentie}
            onItemsChange={setSpoedItems}
          />
        );
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div ref={topRef} className="flex flex-col gap-6 pb-28">
      {/* Session restored banner */}
      {showRestoredBanner && (
        <div className="sticky top-0 z-40 flex items-start justify-between gap-3 rounded bg-gray-800 border border-[#d4af37] px-4 py-3 text-sm text-white shadow-lg">
          <span>
            <span className="font-semibold" style={{ color: "#d4af37" }}>
              {language === 'nl' ? 'Sessie hersteld.' : 'Session restored.'}
            </span>{" "}
            {language === 'nl'
              ? 'Klant- en gebouwgegevens zijn teruggezet. Voer de dakwerkzaamheden opnieuw in.'
              : 'Customer and building info has been restored. Please re-enter the roofing work.'
            }
          </span>
          <button
            type="button"
            onClick={() => setShowRestoredBanner(false)}
            className="shrink-0 text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Validation error banner */}
      {validationError && (
        <div className="sticky top-0 z-40 rounded bg-[#cc0000] px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {labels.validationBanner}
        </div>
      )}

      {/* Customer info */}
      <CustomerInfoForm
        value={customer}
        onChange={(info) => {
          setCustomer(info);
          if (validationError) {
            // Re-check live once the user starts fixing
            if (
              info.naam.trim() &&
              info.adres.trim() &&
              info.telefoon.trim()
            ) {
              setValidationError(false);
            }
          }
        }}
        language={language}
      />

      {/* Building info */}
      <BuildingInfoForm
        value={building}
        onChange={setBuilding}
        language={language}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Roof work section with tab bar                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-0 rounded-lg border border-gray-700 overflow-hidden">
        {/* Section title */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-bold" style={{ color: "#d4af37" }}>
            {labels.roofwork}
          </h3>
        </div>

        {/* Tab bar — horizontal scroll on mobile */}
        <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-700 scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            // Count items in this category to show a badge
            const itemCounts: Record<TabId, number> = {
              flat_roof: flatRoofItems.length,
              tiled_roof: tiledRoofItems.length,
              gutters: gutterItems.length,
              chimney: chimneyItems.length,
              skylights: skylightItems.length,
              solar: solarItems.length,
              insulation: insulationItems.length,
              other: otherItems.length,
              spoed: spoedItems.length,
            };
            const count = itemCounts[tab.id];
            const isSpoed = tab.id === "spoed";
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? isSpoed
                      ? "border-[#cc0000] text-[#cc0000] bg-gray-800"
                      : "border-[#d4af37] text-[#d4af37] bg-gray-800"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {language === "nl" ? tab.nl : tab.en}
                {count > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${isSpoed ? "bg-[#cc0000] text-white" : "bg-[#d4af37] text-black"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active configurator */}
        <div className="bg-gray-900 p-4">{renderConfigurator()}</div>
      </div>

      {/* Equipment & Rentals */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
        <EquipmentRentals
          margins={margins}
          onItemsChange={setEquipmentItems}
          language={language}
        />
      </div>

      {/* Custom Items */}
      <CustomItems onItemsChange={setCustomItems} language={language} />

      {/* Discount */}
      <DiscountSelector
        value={discount}
        onChange={setDiscount}
        language={language}
      />

      {/* Payment Terms */}
      <PaymentTerms
        value={paymentTerms}
        onChange={setPaymentTerms}
        language={language}
      />

      {/* Warranty */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>
            {language === 'nl' ? 'Garantie' : 'Warranty'}
          </h3>
          <button
            type="button"
            onClick={() => setWarranty(w => ({ ...w, enabled: !w.enabled }))}
            className={`min-h-10 px-4 py-2 rounded text-sm font-medium transition-colors ${warranty.enabled ? 'bg-red-700 text-white hover:bg-red-800' : 'text-black hover:opacity-90'}`}
            style={warranty.enabled ? undefined : { backgroundColor: '#d4af37' }}
          >
            {warranty.enabled
              ? (language === 'nl' ? 'Verwijderen' : 'Remove')
              : (language === 'nl' ? 'Toevoegen' : 'Add')}
          </button>
        </div>
        {warranty.enabled && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-400">
              {language === 'nl' ? 'Garantieperiode:' : 'Warranty period:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {(['1 jaar', '2 jaar', '5 jaar', '10 jaar'] as const).map(p => {
                const periodDisplay: Record<typeof p, Record<'nl' | 'en', string>> = {
                  '1 jaar': { nl: '1 jaar', en: '1 year' },
                  '2 jaar': { nl: '2 jaar', en: '2 years' },
                  '5 jaar': { nl: '5 jaar', en: '5 years' },
                  '10 jaar': { nl: '10 jaar', en: '10 years' },
                };
                return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setWarranty(w => ({ ...w, period: p }))}
                  className={`min-h-10 px-4 py-2 rounded text-sm font-medium transition-colors ${warranty.period === p ? 'text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                  style={warranty.period === p ? { backgroundColor: '#d4af37' } : undefined}
                >
                  {periodDisplay[p][language]}
                </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed price footer — receives all merged items */}
      <PriceFooter
        allItems={allItems}
        discount={discount}
        onFinalize={handleFinalize}
        language={language}
      />
    </div>
  );
}
