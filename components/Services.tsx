"use client";

import { Hammer, Wrench, Shield, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const icons = [Hammer, Wrench, Shield, Search];

export default function Services({ images }: { images: string[] }) {
  const { t } = useLanguage();

  const services = [
    { titleKey: "services.1.title" as const, descKey: "services.1.desc" as const },
    { titleKey: "services.2.title" as const, descKey: "services.2.desc" as const },
    { titleKey: "services.3.title" as const, descKey: "services.3.desc" as const },
    { titleKey: "services.4.title" as const, descKey: "services.4.desc" as const },
  ];

  return (
    <section id="services" className="py-24 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            {t("services.title")}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">{t("services.subtitle")}</p>
          <div className="mt-4 w-16 h-1 bg-[#cc0000] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className="group relative bg-gray-950 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden transition-all duration-300"
              >
                <div className="relative h-48 bg-gray-900">
                  {images[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images[i]}
                      alt={t(service.titleKey)}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon size={40} className="text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700">
                      <Icon size={18} className="text-[#cc0000]" />
                    </div>
                    <h3 className="font-bold text-white">{t(service.titleKey)}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {t(service.descKey)}
                  </p>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl ring-1 ring-[#cc0000]/30" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
