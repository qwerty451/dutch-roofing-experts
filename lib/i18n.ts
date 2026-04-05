export type Locale = "es" | "en" | "nl";

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  nl: "Nederlands",
};

export const localeFlags: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  nl: "🇳🇱",
};

export type TranslationKey =
  | "nav.home"
  | "nav.services"
  | "nav.about"
  | "nav.contact"
  | "hero.badge"
  | "hero.title"
  | "hero.subtitle"
  | "hero.cta"
  | "hero.cta2"
  | "services.title"
  | "services.subtitle"
  | "services.1.title"
  | "services.1.desc"
  | "services.2.title"
  | "services.2.desc"
  | "services.3.title"
  | "services.3.desc"
  | "services.4.title"
  | "services.4.desc"
  | "about.title"
  | "about.subtitle"
  | "about.text"
  | "about.stat1.value"
  | "about.stat1.label"
  | "about.stat2.value"
  | "about.stat2.label"
  | "about.stat3.value"
  | "about.stat3.label"
  | "contact.title"
  | "contact.subtitle"
  | "contact.name"
  | "contact.email"
  | "contact.phone"
  | "contact.message"
  | "contact.submit"
  | "contact.success"
  | "footer.rights"
  | "footer.tagline";

export type Translations = Record<TranslationKey, string>;

export const defaultTranslations: Record<Locale, Translations> = {
  es: {
    "nav.home": "Inicio",
    "nav.services": "Servicios",
    "nav.about": "Nosotros",
    "nav.contact": "Contacto",
    "hero.badge": "Más de 25 años de experiencia holandesa",
    "hero.title": "Dutch Roofing Experts",
    "hero.subtitle": "Empresa familiar especialista en tejados. Materiales holandeses de calidad.",
    "hero.cta": "Solicitar presupuesto gratis",
    "hero.cta2": "Ver servicios",
    "services.title": "Nuestros Servicios",
    "services.subtitle": "Soluciones completas. Materiales holandeses y 15 años de garantía.",
    "services.1.title": "Tejados de tejas",
    "services.1.desc": "Reparación, restauración y sustitución de tejas.",
    "services.2.title": "Tejado plano / Bitumen",
    "services.2.desc": "Reparación e instalación de tejados planos con bitumen.",
    "services.3.title": "Inspección de tejado",
    "services.3.desc": "Inspección gratuita y sin compromiso.",
    "services.4.title": "Servicio de urgencias 24/7",
    "services.4.desc": "Disponibles 24 horas para emergencias.",
    "about.title": "Sobre Nosotros",
    "about.subtitle": "Calidad holandesa en Costa Blanca South",
    "about.text": "Dutch Roofing Experts - Expertos en techos en Costa Blanca South.",
    "about.stat1.value": "25+",
    "about.stat1.label": "Años de experiencia",
    "about.stat2.value": "100%",
    "about.stat2.label": "Clientes satisfechos",
    "about.stat3.value": "15 años",
    "about.stat3.label": "Garantía",
    "contact.title": "Contáctenos",
    "contact.subtitle": "¿Necesita una inspección o presupuesto?",
    "contact.name": "Nombre completo",
    "contact.email": "Correo electrónico",
    "contact.phone": "Teléfono",
    "contact.message": "Mensaje",
    "contact.submit": "Enviar mensaje",
    "contact.success": "¡Mensaje enviado con éxito!",
    "footer.rights": "Todos los derechos reservados.",
    "footer.tagline": "¡Calidad holandesa en su tejado!",
  },
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.contact": "Contact",
    "hero.badge": "Over 25 years of Dutch experience",
    "hero.title": "Dutch Roofing Experts",
    "hero.subtitle": "Family business. Dutch quality materials and craftsmanship.",
    "hero.cta": "Request a free quote",
    "hero.cta2": "View services",
    "services.title": "Our Services",
    "services.subtitle": "Complete solutions. Dutch materials and 15 year guarantee.",
    "services.1.title": "Tiled Roofs",
    "services.1.desc": "Repair, restoration and replacement of tiles.",
    "services.2.title": "Flat Roof / Bitumen",
    "services.2.desc": "Repair and installation of flat roofs with bitumen.",
    "services.3.title": "Roof Inspection",
    "services.3.desc": "Free and no-obligation inspection.",
    "services.4.title": "24/7 Emergency Service",
    "services.4.desc": "Available 24 hours for emergencies.",
    "about.title": "About Us",
    "about.subtitle": "Dutch Quality at Costa Blanca South",
    "about.text": "Dutch Roofing Experts - Your trusted roofer in Costa Blanca South.",
    "about.stat1.value": "25+",
    "about.stat1.label": "Years of experience",
    "about.stat2.value": "100%",
    "about.stat2.label": "Satisfied clients",
    "about.stat3.value": "15 years",
    "about.stat3.label": "Guarantee",
    "contact.title": "Contact Us",
    "contact.subtitle": "Need an inspection or quote?",
    "contact.name": "Full name",
    "contact.email": "Email address",
    "contact.phone": "Phone number",
    "contact.message": "Message",
    "contact.submit": "Send message",
    "contact.success": "Message sent successfully!",
    "footer.rights": "All rights reserved.",
    "footer.tagline": "Dutch quality at Costa Blanca!",
  },
  nl: {
    "nav.home": "Home",
    "nav.services": "Diensten",
    "nav.about": "Over ons",
    "nav.contact": "Contact",
    "hero.badge": "Meer dan 25 jaar Nederlandse ervaring",
    "hero.title": "Dutch Roofing Experts",
    "hero.subtitle": "Familiebedrijf. Nederlandse kwaliteitsmaterialen en vakmanschap.",
    "hero.cta": "Gratis offerte aanvragen",
    "hero.cta2": "Bekijk diensten",
    "services.title": "Onze Diensten",
    "services.subtitle": "Complete oplossingen. Nederlandse materialen en 15 jaar garantie.",
    "services.1.title": "Pannendak",
    "services.1.desc": "Reparatie, herstel en vervanging van pannen.",
    "services.2.title": "Plat dak / Bitumen",
    "services.2.desc": "Reparatie en aanleg van platte daken met bitumen.",
    "services.3.title": "Dakinspectie",
    "services.3.desc": "Gratis en vrijblijvende inspectie.",
    "services.4.title": "24/7 Noodservice",
    "services.4.desc": "24 uur per dag bereikbaar voor noodgevallen.",
    "about.title": "Over Ons",
    "about.subtitle": "Nederlandse kwaliteit aan de Costa Blanca",
    "about.text": "Dutch Roofing Experts - Uw vertrouwde dakdekker aan de Costa Blanca.",
    "about.stat1.value": "25+",
    "about.stat1.label": "Jaar ervaring",
    "about.stat2.value": "100%",
    "about.stat2.label": "Tevreden klanten",
    "about.stat3.value": "15 jaar",
    "about.stat3.label": "Garantie",
    "contact.title": "Neem Contact Op",
    "contact.subtitle": "Inspectie of offerte nodig?",
    "contact.name": "Volledige naam",
    "contact.email": "E-mailadres",
    "contact.phone": "Telefoonnummer",
    "contact.message": "Bericht",
    "contact.submit": "Bericht versturen",
    "contact.success": "Bericht succesvol verzonden!",
    "footer.rights": "Alle rechten voorbehouden.",
    "footer.tagline": "Nederlandse kwaliteit aan de Costa Blanca!",
  },
};
