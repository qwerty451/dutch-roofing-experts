"use client";

import { useState, useRef } from "react";
import type { LineItem, Margins, CustomerInfo, BuildingInfo } from "../../../types/tool";

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
import EquipmentRentals from "./EquipmentRentals";
import LabourConfigurator from "./LabourConfigurator";
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
  | "other";

const TABS: { id: TabId; nl: string; en: string }[] = [
  { id: "flat_roof", nl: "Plat Dak", en: "Flat Roof" },
  { id: "tiled_roof", nl: "Pannendak", en: "Tiled Roof" },
  { id: "gutters", nl: "Goten", en: "Gutters" },
  { id: "chimney", nl: "Schoorsteen", en: "Chimney" },
  { id: "skylights", nl: "Dakramen", en: "Skylights" },
  { id: "solar", nl: "Zonnepanelen", en: "Solar" },
  { id: "insulation", nl: "Isolatie", en: "Insulation" },
  { id: "other", nl: "Overig", en: "Other" },
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
  notities: "",
};

const DEFAULT_PAYMENT_TERMS =
  "50% aanbetaling voor aanvang werkzaamheden, 50% na oplevering.";

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
  // Customer & building state
  // -------------------------------------------------------------------------
  const [customer, setCustomer] = useState<CustomerInfo>(DEFAULT_CUSTOMER);
  const [building, setBuilding] = useState<BuildingInfo>(DEFAULT_BUILDING);

  // -------------------------------------------------------------------------
  // Roof configurator item arrays (one per category)
  // -------------------------------------------------------------------------
  const [flatRoofItems, setFlatRoofItems] = useState<LineItem[]>([]);
  const [tiledRoofItems, setTiledRoofItems] = useState<LineItem[]>([]);
  const [gutterItems, setGutterItems] = useState<LineItem[]>([]);
  const [chimneyItems, setChimneyItems] = useState<LineItem[]>([]);
  const [skylightItems, setSkylightItems] = useState<LineItem[]>([]);
  const [solarItems, setSolarItems] = useState<LineItem[]>([]);
  const [insulationItems, setInsulationItems] = useState<LineItem[]>([]);
  const [otherItems, setOtherItems] = useState<LineItem[]>([]);

  // Equipment, labour & custom items
  const [equipmentItems, setEquipmentItems] = useState<LineItem[]>([]);
  const [labourItems, setLabourItems] = useState<LineItem[]>([]);
  const [customItems, setCustomItems] = useState<LineItem[]>([]);

  // -------------------------------------------------------------------------
  // Discount & payment terms
  // -------------------------------------------------------------------------
  const [discount, setDiscount] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<string>(DEFAULT_PAYMENT_TERMS);

  // -------------------------------------------------------------------------
  // Tab & validation state
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabId>("flat_roof");
  const [validationError, setValidationError] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

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
    ...equipmentItems,
    ...labourItems,
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
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div ref={topRef} className="flex flex-col gap-6 pb-28">
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
            };
            const count = itemCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-[#d4af37] text-[#d4af37] bg-gray-800"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {language === "nl" ? tab.nl : tab.en}
                {count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d4af37] text-black text-xs font-bold">
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

      {/* Labour */}
      <LabourConfigurator
        margins={margins}
        onItemsChange={setLabourItems}
        language={language}
      />

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
