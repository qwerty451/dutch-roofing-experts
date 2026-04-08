"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Phone } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const { t, locale } = useLanguage();
  return (
    <footer className="border-t border-gray-900 py-8 px-6 bg-black">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Image
          src="/uploads/logo.png"
          alt="Dutch Roofing Experts"
          width={32}
          height={32}
          className="w-auto h-8"
        />
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Phone size={14} className="text-[#d4af37]" />
          <span>(+31) 6 45577172</span>
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
