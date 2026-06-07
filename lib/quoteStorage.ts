import fs from 'fs';
import path from 'path';
import type { SavedQuote } from '../types/tool';

// Re-export for convenience
export type { SavedQuote };

const QUOTES_FILE = path.join(process.cwd(), 'data', 'quotes.json');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface QuotesStore {
  lastNumber: number;
  quotes: SavedQuote[];
}

function ensureDataDir(): void {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readStore(): QuotesStore {
  ensureDataDir();
  if (fs.existsSync(QUOTES_FILE)) {
    const raw = fs.readFileSync(QUOTES_FILE, 'utf-8');
    return JSON.parse(raw) as QuotesStore;
  }
  return { lastNumber: 0, quotes: [] };
}

function writeStore(store: QuotesStore): void {
  ensureDataDir();
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// generateQuoteId
// Returns a string like "DRE-2026-001" (zero-padded to 3 digits).
// ---------------------------------------------------------------------------
export function generateQuoteId(year: number, number: number): string {
  const padded = String(number).padStart(3, '0');
  return `DRE-${year}-${padded}`;
}

// ---------------------------------------------------------------------------
// saveQuote
// Reads the store, increments lastNumber, assigns an id, pushes the quote,
// writes back, and returns the generated id.
// ---------------------------------------------------------------------------
export function saveQuote(quote: Omit<SavedQuote, 'id'>): string {
  const store = readStore();
  const year = new Date().getFullYear();
  const newNumber = store.lastNumber + 1;
  const id = generateQuoteId(year, newNumber);

  const savedQuote: SavedQuote = { id, ...quote };

  store.lastNumber = newNumber;
  store.quotes.push(savedQuote);

  writeStore(store);
  return id;
}

// ---------------------------------------------------------------------------
// getQuotes
// Returns the full store contents.
// ---------------------------------------------------------------------------
export function getQuotes(): QuotesStore {
  return readStore();
}
