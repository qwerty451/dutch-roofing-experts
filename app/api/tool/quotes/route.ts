import { NextRequest, NextResponse } from 'next/server';
import { saveQuote, getQuotes } from '../../../../lib/quoteStorage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = saveQuote(body);
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Save quote error:', error);
    return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = getQuotes();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get quotes error:', error);
    return NextResponse.json({ error: 'Failed to retrieve quotes' }, { status: 500 });
  }
}
