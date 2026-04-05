"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Phone } from "lucide-react";

export default function Footer() {
  const { t, locale } = useLanguage();
  return (
    <footer className="border-t border-gray-900 py-8 px-6 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 5L55 18V42L30 55L5 42V18L30 5Z" fill="#d4af37" stroke="#d4af37" strokeWidth="2"/>
          <text x="30" y="30" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">DRE</text>
        </svg>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Phone size={14} className="text-[#d4af37]" />
          <span>(+31) 6 123 456 78</span>
        </div>
        <p className="text-gray-600 text-sm">
          © {new Date().getFullYear()} Dutch Roofing Experts. {t("footer.rights")}
        </p>
        <p className="text-gray-600 text-sm">
          {locale === "nl" ? "Nederlandse kwaliteit aan de Costa Blanca" : locale === "en" ? "Dutch quality at Costa Blanca" : "Calidad holandesa en Costa Blanca"}
        </p>
      </div>
    </footer>
  );
}
