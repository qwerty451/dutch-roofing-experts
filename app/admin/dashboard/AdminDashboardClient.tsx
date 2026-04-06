"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Image as ImageIcon, Languages, ChevronDown, ChevronUp } from "lucide-react";
import type { SiteContent } from "@/lib/content";
import { localeFlags, localeNames, type Locale, type TranslationKey } from "@/lib/i18n";
import ImageUploader from "@/components/admin/ImageUploader";

const locales: Locale[] = ["es", "en", "nl"];

const translationGroups: { label: string; keys: TranslationKey[] }[] = [
  {
    label: "Navigatie",
    keys: ["nav.home", "nav.services", "nav.about", "nav.contact"],
  },
  {
    label: "Hero sectie",
    keys: ["hero.badge", "hero.title", "hero.subtitle", "hero.cta", "hero.cta2"],
  },
  {
    label: "Diensten",
    keys: [
      "services.title", "services.subtitle",
      "services.1.title", "services.1.desc",
      "services.2.title", "services.2.desc",
      "services.3.title", "services.3.desc",
      "services.4.title", "services.4.desc",
    ],
  },
  {
    label: "Over ons",
    keys: [
      "about.title", "about.subtitle", "about.text",
      "about.stat1.value", "about.stat1.label",
      "about.stat2.value", "about.stat2.label",
      "about.stat3.value", "about.stat3.label",
    ],
  },
  {
    label: "Contactformulier",
    keys: [
      "contact.title", "contact.subtitle",
      "contact.name", "contact.email", "contact.phone",
      "contact.message", "contact.submit", "contact.success",
    ],
  },
  {
    label: "Footer",
    keys: ["footer.rights", "footer.tagline"],
  },
];

// Human-readable Dutch labels for each translation key
const keyLabels: Partial<Record<TranslationKey, string>> = {
  "nav.home": "Menu: Home",
  "nav.services": "Menu: Diensten",
  "nav.about": "Menu: Over ons",
  "nav.contact": "Menu: Contact",
  "hero.badge": "Hero: Badge tekst",
  "hero.title": "Hero: Titel",
  "hero.subtitle": "Hero: Ondertitel",
  "hero.cta": "Hero: Knop 1 (offerte)",
  "hero.cta2": "Hero: Knop 2 (diensten)",
  "services.title": "Diensten: Titel",
  "services.subtitle": "Diensten: Ondertitel",
  "services.1.title": "Dienst 1: Naam",
  "services.1.desc": "Dienst 1: Omschrijving",
  "services.2.title": "Dienst 2: Naam",
  "services.2.desc": "Dienst 2: Omschrijving",
  "services.3.title": "Dienst 3: Naam",
  "services.3.desc": "Dienst 3: Omschrijving",
  "services.4.title": "Dienst 4: Naam",
  "services.4.desc": "Dienst 4: Omschrijving",
  "about.title": "Over ons: Titel",
  "about.subtitle": "Over ons: Ondertitel",
  "about.text": "Over ons: Tekst",
  "about.stat1.value": "Statistiek 1: Waarde",
  "about.stat1.label": "Statistiek 1: Label",
  "about.stat2.value": "Statistiek 2: Waarde",
  "about.stat2.label": "Statistiek 2: Label",
  "about.stat3.value": "Statistiek 3: Waarde",
  "about.stat3.label": "Statistiek 3: Label",
  "contact.title": "Contact: Titel",
  "contact.subtitle": "Contact: Ondertitel",
  "contact.name": "Contact: Naam veld",
  "contact.email": "Contact: E-mail veld",
  "contact.phone": "Contact: Telefoon veld",
  "contact.message": "Contact: Bericht veld",
  "contact.submit": "Contact: Verstuur knop",
  "contact.success": "Contact: Succesbericht",
  "footer.rights": "Footer: Rechten tekst",
  "footer.tagline": "Footer: Tagline",
};

export default function AdminDashboardClient({ initialContent }: { initialContent: SiteContent }) {
  const router = useRouter();
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [activeLocale, setActiveLocale] = useState<Locale>("es");
  const [activeTab, setActiveTab] = useState<"images" | "translations">("images");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Navigatie: true });

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setSaveError("Opslaan mislukt. Probeer opnieuw.");
    }
  };

  const updateImage = (key: "hero" | "about" | "whatsapp", value: string) => {
    setContent((c) => ({ ...c, images: { ...c.images, [key]: value } }));
  };

  const updateServiceImage = (i: number, value: string) => {
    const services = [...content.images.services];
    services[i] = value;
    setContent((c) => ({ ...c, images: { ...c.images, services } }));
  };

  const updateTranslation = (locale: Locale, key: TranslationKey, value: string) => {
    setContent((c) => ({
      ...c,
      translations: {
        ...c.translations,
        [locale]: { ...c.translations[locale], [key]: value },
      },
    }));
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((g) => ({ ...g, [label]: !g[label] }));
  };

  const isTextarea = (key: TranslationKey) =>
    ["about.text", "hero.subtitle", "services.subtitle", "contact.subtitle"].includes(key);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-[#d4af37]">Beheerpaneel</h1>
          <p className="text-gray-500 text-xs">Dakservice Van Heijst</p>
        </div>
        <div className="flex items-center gap-3">
          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-white font-bold rounded-lg hover:bg-[#d4af37] transition-all text-sm disabled:opacity-60"
          >
            <Save size={16} />
            {saved ? "Opgeslagen!" : saving ? "Bezig..." : "Opslaan"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            Uitloggen
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-900">
          {(["images", "translations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#d4af37] text-[#d4af37]"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "images" ? <ImageIcon size={16} /> : <Languages size={16} />}
              {tab === "images" ? "Afbeeldingen" : "Vertalingen"}
            </button>
          ))}
        </div>

        {/* Afbeeldingen tab */}
        {activeTab === "images" && (
          <div className="space-y-6">
            <p className="text-gray-500 text-sm">
              Klik op een afbeelding om een nieuw bestand te uploaden. U kunt daarna bijsnijden.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
                <ImageUploader
                  label="Hero afbeelding"
                  value={content.images.hero}
                  aspect={16 / 9}
                  onChange={(url) => updateImage("hero", url)}
                />
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
                <ImageUploader
                  label="Over ons afbeelding"
                  value={content.images.about}
                  aspect={4 / 5}
                  onChange={(url) => updateImage("about", url)}
                />
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
                <ImageUploader
                  label="WhatsApp foto (horizontaal)"
                  value={content.images.whatsapp || ""}
                  aspect={16 / 9}
                  onChange={(url) => updateImage("whatsapp", url)}
                />
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-semibold text-gray-300 mb-4">
                Diensten afbeeldingen
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {content.images.services.map((img, i) => (
                  <ImageUploader
                    key={i}
                    label={`Dienst ${i + 1}`}
                    value={img}
                    aspect={4 / 3}
                    onChange={(url) => updateServiceImage(i, url)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vertalingen tab */}
        {activeTab === "translations" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm text-gray-400">Taal bewerken:</span>
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLocale(l)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeLocale === l
                      ? "bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37]"
                      : "border border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <span>{localeFlags[l]}</span>
                  {localeNames[l]}
                </button>
              ))}
            </div>

            {translationGroups.map((group) => (
              <div key={group.label} className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  {group.label}
                  {openGroups[group.label] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {openGroups[group.label] && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-900 pt-4">
                    {group.keys.map((key) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1 font-medium">
                          {keyLabels[key] ?? key}
                        </label>
                        {isTextarea(key) ? (
                          <textarea
                            rows={3}
                            value={content.translations[activeLocale]?.[key] ?? ""}
                            onChange={(e) => updateTranslation(activeLocale, key, e.target.value)}
                            className="w-full px-3 py-2 bg-black border border-gray-800 focus:border-[#d4af37]/60 rounded-lg text-white text-sm outline-none transition-colors resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={content.translations[activeLocale]?.[key] ?? ""}
                            onChange={(e) => updateTranslation(activeLocale, key, e.target.value)}
                            className="w-full px-3 py-2 bg-black border border-gray-800 focus:border-[#d4af37]/60 rounded-lg text-white text-sm outline-none transition-colors"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
