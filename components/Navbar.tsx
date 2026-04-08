"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinks = [
  { key: "nav.home" as const, href: "#home" },
  { key: "nav.services" as const, href: "#services" },
  { key: "nav.about" as const, href: "#about" },
  { key: "nav.contact" as const, href: "#contact" },
];

export default function Navbar() {
  const { t, locale } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        scrolled
          ? "bg-black/95 backdrop-blur-md border-b border-[#d4af37]/20"
          : "bg-black/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2">
          <Image
            src="/uploads/logo.png"
            alt="Dutch Roofing Experts"
            width={40}
            height={40}
            className="w-auto h-10"
          />
        </a>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm text-gray-300 hover:text-[#d4af37] transition-colors duration-200"
            >
              {t(link.key)}
            </a>
          ))}
        </div>

<div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+31645577172"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Call us"
            >
            <Phone size={18} className="text-[#d4af37]" />
            <span className="text-sm font-medium">(+31) 6 45577172</span>
          </a>
          <a
            href="https://wa.me/+31645577172"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-1 bg-[#25D366] text-white rounded-md hover:bg-[#20BD5A] transition-colors"
            aria-label="WhatsApp"
            >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.767 2.094 4.192.008.248.164.347.33.473.151.015.347.023.528.024.198 0 .397-.01.576-.02.297-.149 1.255-.511 1.512-1.012.248-.495.248-.916.173-1.193l-.01-.022zm-5.504.71c-.297.149-1.758.867-2.03.967-.273.099-.471.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.767 2.094 4.192.008.248.164.347.33.473.151.015.347.023.528.024.198 0 .397-.01.576-.02.297-.149 1.255-.511 1.512-1.012.248-.495.248-.916.173-1.193l-.01-.022z"/>
            </svg>
            <span className="text-sm font-medium">WhatsApp</span>
          </a>
          <LanguageSwitcher />
          <a
            href="#contact"
            className="px-4 py-2 text-sm font-semibold bg-[#cc0000] text-white rounded-md hover:bg-[#a30000] transition-colors neon-glow"
          >
            {t("hero.cta")}
          </a>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            style={{
              padding: '8px',
              backgroundColor: '#333',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            {mobileMenuOpen ? (
              <X size={24} color="white" />
            ) : (
              <Menu size={24} color="white" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.98)',
          padding: '20px',
          borderTop: '1px solid rgba(204,0,0,0.3)',
          zIndex: 9998
        }}>
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-300 hover:text-[#d4af37] transition-colors text-lg"
              >
                {t(link.key)}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <a
                href="tel:+31645577172"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Phone size={18} />
                <span>(+31) 6 45577172</span>
              </a>
            </div>
            <div>
              <a
                href="https://wa.me/+31645577172"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#25D366] text-white rounded-md hover:bg-[#20BD5A] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.767 2.094 4.192.008.248.164.347.33.473.151.015.347.023.528.024.198 0 .397-.01.576-.02.297-.149 1.255-.511 1.512-1.012.248-.495.248-.916.173-1.193l-.01-.022zm-5.504.71c-.297.149-1.758.867-2.03.967-.273.099-.471.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.767 2.094 4.192.008.248.164.347.33.473.151.015.347.023.528.024.198 0 .397-.01.576-.02.297-.149 1.255-.511 1.512-1.012.248-.495.248-.916.173-1.193l-.01-.022z"/>
                </svg>
                <span>{locale === "nl" ? "WhatsApp" : locale === "en" ? "WhatsApp" : "WhatsApp"}</span>
              </a>
            </div>
            <div className="pt-2">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 text-sm font-semibold bg-[#cc0000] text-white rounded-md"
              >
                {t("hero.cta")}
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
