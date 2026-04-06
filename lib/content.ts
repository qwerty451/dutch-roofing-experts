import { defaultTranslations, type Locale, type Translations } from "./i18n";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "content.json");

export interface SiteContent {
  translations: Record<Locale, Translations>;
  images: {
    hero: string;
    about: string;
    services: string[];
    whatsapp?: string;
  };
}

function ensureDataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getContent(): SiteContent {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return {
    translations: defaultTranslations,
    images: {
      hero: "",
      about: "",
      services: ["", "", "", ""],
      whatsapp: "",
    },
  };
}

export function saveContent(content: SiteContent): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2), "utf-8");
}
