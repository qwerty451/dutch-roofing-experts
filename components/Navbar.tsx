"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinks = [
  { key: "nav.home" as const, href: "#home" },
  { key: "nav.services" as const, href: "#services" },
  { key: "nav.about" as const, href: "#about" },
  { key: "nav.contact" as const, href: "#contact" },
];

export default function Navbar() {
  const { t } = useLanguage();
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
          <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 5L55 18V42L30 55L5 42V18L30 5Z" fill="#d4af37" stroke="#d4af37" strokeWidth="2"/>
            <text x="30" y="30" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">DRE</text>
            <text x="30" y="48" textAnchor="middle" fill="#d4af37" fontSize="5" fontWeight="bold">COSTA BLANCA SOUTH</text>
          </svg>
          <span className="text-white font-semibold text-sm hidden sm:block">
            Dutch Roofing Experts
          </span>
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

        <div className="hidden md:flex items-center gap-4">
          <a
href="tel:+31645577172"
            >
            <Phone size={18} className="text-[#d4af37]" />
            <span className="text-sm font-medium">(+31) 6 45577172</span>
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
