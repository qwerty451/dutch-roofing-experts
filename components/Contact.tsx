"use client";

import { useState } from "react";
import { Send, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type ServiceType = "repair" | "installation" | "inspection" | "maintenance" | "emergency";
type RoofType = "tiled" | "flat" | "bitumen" | "metal" | "other";
type Urgency = "regular" | "soon" | "emergency";

export default function Contact() {
  const { locale } = useLanguage();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    serviceType: "" as ServiceType | "",
    roofType: "" as RoofType | "",
    description: "",
    urgency: "regular" as Urgency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
    }
  };

  const serviceOptions: { value: ServiceType; label: string }[] = [
    { value: "repair", label: locale === "nl" ? "Reparatie" : locale === "en" ? "Repair" : "Reparación" },
    { value: "installation", label: locale === "nl" ? "Nieuw dak / Installatie" : locale === "en" ? "New roof / Installation" : "Nuevo tejado" },
    { value: "inspection", label: locale === "nl" ? "Inspectie" : locale === "en" ? "Inspection" : "Inspección" },
    { value: "maintenance", label: locale === "nl" ? "Onderhoud" : locale === "en" ? "Maintenance" : "Mantenimiento" },
    { value: "emergency", label: locale === "nl" ? "Noodservice" : locale === "en" ? "Emergency service" : "Servicio de emergencia" },
  ];

  const roofOptions: { value: RoofType; label: string }[] = [
    { value: "tiled", label: locale === "nl" ? "Pannendak" : locale === "en" ? "Tiled roof" : "Tejado de tejas" },
    { value: "flat", label: locale === "nl" ? "Plat dak" : locale === "en" ? "Flat roof" : "Tejado plano" },
    { value: "bitumen", label: locale === "nl" ? "Bitumen" : locale === "en" ? "Bitumen" : "Bitumen" },
    { value: "metal", label: locale === "nl" ? "Metaal" : locale === "en" ? "Metal" : "Metal" },
    { value: "other", label: locale === "nl" ? "Anders" : locale === "en" ? "Other" : "Otro" },
  ];

  return (
    <section id="contact" className="py-24 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            {locale === "nl" ? "Gratis Offerte Aanvragen" : locale === "en" ? "Request Free Quote" : "Solicitar Presupuesto Gratis"}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {locale === "nl" 
              ? "Vul onderstaand formulier in en wij nemen binnen 24 uur contact met u op. Gratis en vrijblijvend."
              : locale === "en"
              ? "Fill in the form below and we will contact you within 24 hours. Free and no obligation."
              : "Rellene el formulario a continuación y nos pondremos en contacto con usted en 24 horas. Gratis y sin compromiso."
            }
          </p>
          <div className="mt-4 w-16 h-1 bg-[#cc0000] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gray-800 border border-gray-800/20 shrink-0">
                <Phone size={20} className="text-[#cc0000]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  {locale === "nl" ? "Telefoon" : locale === "en" ? "Phone" : "Teléfono"}
                </h3>
                <p className="text-gray-400">(+31) 6 45577172</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gray-800 border border-gray-800/20 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.767 2.094 4.192.008.248.164.347.33.473.151.015.347.023.528.024.198 0 .397-.01.576-.02.297-.149 1.255-.511 1.512-1.012.248-.495.248-.916.173-1.193l-.01-.022zm-5.504.71c-.297.149-1.758.867-2.03.967-.273.099-.471.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.767 2.094 4.192.008.248.164.347.33.473.151.015.347.023.528.024.198 0 .397-.01.576-.02.297-.149 1.255-.511 1.512-1.012.248-.495.248-.916.173-1.193l-.01-.022z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">WhatsApp</h3>
                <a
                  href="https://wa.me/+31645577172"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white rounded-md hover:bg-[#20BD5A] transition-colors text-sm font-medium"
                >
                  {locale === "nl" ? "Bericht ons" : locale === "en" ? "Message us" : "Escríbenos"}
                </a>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gray-800 border border-gray-800/20 shrink-0">
                <Mail size={20} className="text-[#cc0000]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Email</h3>
                <p className="text-gray-400">dutchroofingexperts@yahoo.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gray-800 border border-gray-800/20 shrink-0">
                <Clock size={20} className="text-[#cc0000]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">
                  {locale === "nl" ? "Bereikbaarheid" : locale === "en" ? "Availability" : "Disponibilidad"}
                </h3>
                <p className="text-gray-400">
                  {locale === "nl" ? "Ma-Vr: 08:00 - 18:00" : locale === "en" ? "Mon-Fri: 08:00 - 18:00" : "Lun-Vie: 08:00 - 18:00"}
                  <br />
                  {locale === "nl" ? "24/7 Noodservice" : locale === "en" ? "24/7 Emergency" : "24/7 Emergencia"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-[#cc0000]">
                <CheckCircle size={18} />
                <span className="text-sm">
                  {locale === "nl" ? "Gratis inspectie" : locale === "en" ? "Free inspection" : "Inspección gratuita"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#cc0000] mt-2">
                <CheckCircle size={18} />
                <span className="text-sm">
                  {locale === "nl" ? "15 jaar garantie" : locale === "en" ? "15 year guarantee" : "15 años de garantía"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#cc0000] mt-2">
                <CheckCircle size={18} />
                <span className="text-sm">
                  {locale === "nl" ? "Vrijblijvend offerte" : locale === "en" ? "No obligation quote" : "Presupuesto sin compromiso"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {sent ? (
              <div className="p-8 rounded-xl bg-gray-800 border border-gray-800/40 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <CheckCircle size={32} className="text-[#cc0000]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {locale === "nl" ? "Aanvraag verzonden!" : locale === "en" ? "Request sent!" : "¡Solicitud enviada!"}
                </h3>
                <p className="text-gray-400">
                  {locale === "nl" 
                    ? "Wij nemen binnen 24 uur contact met u op."
                    : locale === "en"
                    ? "We will contact you within 24 hours."
                    : "Nos pondremos en contacto con usted en 24 horas."
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Naam *" : locale === "en" ? "Name *" : "Nombre *"}
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors"
                      placeholder={locale === "nl" ? "Uw volledige naam" : locale === "en" ? "Your full name" : "Su nombre completo"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Telefoon *" : locale === "en" ? "Phone *" : "Teléfono *"}
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors"
                      placeholder="(+31) 6 123 456 78"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {locale === "nl" ? "E-mailadres" : locale === "en" ? "Email" : "Correo electrónico"}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors"
                    placeholder="email@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Adres" : locale === "en" ? "Address" : "Dirección"}
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors"
                      placeholder={locale === "nl" ? "Straatnaam + huisnummer" : locale === "en" ? "Street + number" : "Calle + número"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Postcode" : locale === "en" ? "Postal code" : "Código postal"}
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors"
                      placeholder="1234 AB"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Soort dienst" : locale === "en" ? "Service type" : "Tipo de servicio"}
                    </label>
                    <select
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white outline-none transition-colors"
                    >
                      <option value="">
                        {locale === "nl" ? "Kies een optie" : locale === "en" ? "Select an option" : "Seleccione una opción"}
                      </option>
                      {serviceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Soort dak" : locale === "en" ? "Roof type" : "Tipo de tejado"}
                    </label>
                    <select
                      value={form.roofType}
                      onChange={(e) => setForm({ ...form, roofType: e.target.value as RoofType })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white outline-none transition-colors"
                    >
                      <option value="">
                        {locale === "nl" ? "Kies een optie" : locale === "en" ? "Select an option" : "Seleccione una opción"}
                      </option>
                      {roofOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {locale === "nl" ? "Beschrijving van het probleem" : locale === "en" ? "Describe the problem" : "Describa el problema"}
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white placeholder-gray-600 outline-none transition-colors resize-none"
                    placeholder={locale === "nl" 
                      ? "Beschrijf uw dakprobleem zo gedetailleerd mogelijk..." 
                      : locale === "en" 
                      ? "Describe your roof problem in as much detail as possible..." 
                      : "Describa su problema de techo con el mayor detalle posible..."
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {locale === "nl" ? "Urgentie" : locale === "en" ? "Urgency" : "Urgencia"}
                    </label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm({ ...form, urgency: e.target.value as Urgency })}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 focus:border-gray-800/60 rounded-lg text-white outline-none transition-colors"
                    >
                      <option value="regular">
                        {locale === "nl" ? "Normaal" : locale === "en" ? "Regular" : "Normal"}
                      </option>
                      <option value="soon">
                        {locale === "nl" ? "Zo snel mogelijk" : locale === "en" ? "As soon as possible" : "Lo antes posible"}
                      </option>
                      <option value="emergency">
                        {locale === "nl" ? "Noodgevallet" : locale === "en" ? "Emergency" : "Emergencia"}
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#d4af37] text-black font-bold rounded-lg hover:bg-[#b8962e] transition-all neon-glow disabled:opacity-60"
                >
                  {loading ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      {locale === "nl" ? "Offerte Aanvragen" : locale === "en" ? "Request Quote" : "Solicitar Presupuesto"}
                      <Send size={18} />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  {locale === "nl" 
                    ? "Door dit formulier in te vullen gaat u akkoord met onze privacyverklaring. Wij gebruiken uw gegevens alleen om uw aanvraag te verwerken."
                    : locale === "en"
                    ? "By submitting this form you agree to our privacy policy. We only use your data to process your request."
                    : "Al enviar este formulario acepta nuestra política de privacidad. Solo usamos sus datos para procesar su solicitud."
                  }
                </p>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
