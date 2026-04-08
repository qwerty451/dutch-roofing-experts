"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Shield, Award, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function About({ aboutImage, whatsappImage }: { aboutImage: string; whatsappImage?: string }) {
  const { t, locale } = useLanguage();
  const secondImage = "/uploads/standing_on_roof.jpeg";
  const thirdImage = whatsappImage || "/uploads/whatsapp-horizontal.jpeg";

  const stats = [
    { value: "about.stat1.value" as const, label: "about.stat1.label" as const },
    { value: "about.stat2.value" as const, label: "about.stat2.label" as const },
    { value: "about.stat3.value" as const, label: "about.stat3.label" as const },
  ];

  return (
    <section id="about" className="py-24 px-6 bg-gray-950">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-80 lg:h-[450px] rounded-2xl overflow-hidden border border-gray-800">
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(204,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(204,0,0,0.2) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center mb-4 overflow-hidden">
                  <Image
                    src="/uploads/logo.png"
                    alt="DRE"
                    width={60}
                    height={60}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[#d4af37] text-2xl font-black">25+</span>
                  <p className="text-gray-500 text-sm mt-1">
                    {locale === "nl" ? "Jaar ervaring" : locale === "en" ? "Years experience" : "Años experiencia"}
                  </p>
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  <div className="w-12 h-1 bg-[#d4af37] rounded-full" />
                  <div className="w-12 h-1 bg-[#d4af37] rounded-full" />
                  <div className="w-12 h-1 bg-[#d4af37] rounded-full" />
                </div>
              </div>
            </div>
            <div className="relative h-80 lg:h-[450px] rounded-2xl overflow-hidden border border-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={secondImage}
                alt="Dutch Roofing Experts - Our work"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-4 relative h-48 lg:h-56 rounded-2xl overflow-hidden border border-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thirdImage}
              alt="Dutch Roofing Experts - Project work"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-gray-700 rounded-br-2xl" />
          <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-gray-700 rounded-tl-2xl" />
        </div>

        <div>
          <p className="text-[#d4af37] text-sm font-semibold uppercase tracking-widest mb-3">
            {locale === "nl" ? "Nederlandse kwaliteit" : locale === "en" ? "Dutch Quality" : "Calidad Holandesa"}
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            {t("about.title")}
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">
            {t("about.text")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#d4af37]" />
              <span className="text-gray-300">
                {locale === "nl" ? "15 jaar garantie" : locale === "en" ? "15 year guarantee" : "15 años de garantía"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Award size={20} className="text-[#d4af37]" />
              <span className="text-gray-300">
                {locale === "nl" ? "Nederlandse materialen" : locale === "en" ? "Dutch materials" : "Materiales holandeses"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-[#d4af37]" />
              <span className="text-gray-300">
                {locale === "nl" ? "VCA gecertificeerd" : locale === "en" ? "VCA certified" : "Certificado VCA"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-[#d4af37]" />
              <span className="text-gray-300">
                {locale === "nl" ? "Gratis inspectie" : locale === "en" ? "Free inspection" : "Inspección gratuita"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-[#d4af37] neon-glow-text">
                  {t(stat.value)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
