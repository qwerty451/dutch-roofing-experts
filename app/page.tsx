import { getContent } from "@/lib/content";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function Home() {
  const content = getContent();

  return (
    <LanguageProvider initialTranslations={content.translations}>
      <Navbar />
      <main>
        <Hero heroImage={content.images.hero} />
        <Services images={content.images.services} />
        <About aboutImage={content.images.about} whatsappImage={content.images.whatsapp} />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
