"use client";

import { ArrowRight, ChevronDown, Shield, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero({ heroImage }: { heroImage: string }) {
  const { t, locale } = useLanguage();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
          {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt="Dutch Roofing Experts - Professional roofing Costa Blanca"
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-black via-gray-950 to-black" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(204,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(204,0,0,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute inset-0 bg-radial-gradient" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-block bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-8 border border-[#d4af37]/20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-700 bg-gray-800/30 text-[#cc0000] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#cc0000] animate-pulse" />
            {t("hero.badge")}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 leading-none">
            <span className="text-white">Dutch Roofing</span>
            <br />
            <span className="text-[#d4af37] neon-glow-text">Experts</span>
          </h1>

          <p className="text-[#d4af37] font-semibold mb-6">
            Costa Blanca South
          </p>

        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6">
          {locale === "nl" 
            ? "Nederlandse kwaliteit dakwerk. Meer dan 25 jaar ervaring met Nederlandse materialen en technieken."
            : locale === "en"
            ? "Dutch quality roofing. Over 25 years of experience using Dutch materials and techniques."
            : "Techos de calidad holandesa. Más de 25 años de experiencia usando materiales y técnicas holandesas."
          }
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-gray-700">
            <Shield size={18} className="text-[#cc0000]" />
            <span className="text-sm text-gray-300">
              {locale === "nl" ? "15 jaar garantie" : locale === "en" ? "15 year guarantee" : "15 años de garantía"}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-[#d4af37]/30">
            <Award size={18} className="text-[#d4af37]" />
            <span className="text-sm text-gray-300">
              {locale === "nl" ? "Nederlandse kwaliteit" : locale === "en" ? "Dutch quality materials" : "Materiales holandeses"}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#d4af37] text-black font-bold rounded-lg hover:bg-[#b8962e] transition-all neon-glow hover:scale-105"
          >
            {t("hero.cta")}
            <ArrowRight size={18} />
          </a>
          <a
            href="#services"
            className="inline-flex items-center gap-2 px-8 py-4 border border-[#d4af37]/40 text-white font-semibold rounded-lg hover:border-[#d4af37] hover:bg-[#d4af37]/10 transition-all"
          >
            {t("hero.cta2")}
          </a>
        </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#cc0000] animate-bounce">
        <ChevronDown size={28} />
      </div>
    </section>
  );
}
