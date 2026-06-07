import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, customerEmail, quoteId } = body as {
      pdfBase64: string;
      customerEmail: string;
      quoteId: string;
    };

    if (!pdfBase64 || !customerEmail || !quoteId) {
      return NextResponse.json(
        { error: 'Ontbrekende velden: pdfBase64, customerEmail en quoteId zijn verplicht.' },
        { status: 400 },
      );
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: customerEmail,
      cc: process.env.SMTP_TO,
      subject: `Offerte ${quoteId} — Dutch Roofing Experts`,
      html: `
<div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
  <div style="background: #111111; padding: 20px 24px; margin-bottom: 24px;">
    <h1 style="color: #d4af37; font-size: 20px; margin: 0 0 4px 0;">Dutch Roofing Experts</h1>
    <p style="color: #cccccc; font-size: 13px; margin: 0;">Costa Blanca South</p>
  </div>

  <div style="padding: 0 24px 24px 24px;">
    <p style="font-size: 15px; margin-bottom: 16px;">Geachte klant,</p>

    <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      Hartelijk dank voor uw interesse in onze diensten. Bijgevoegd vindt u uw offerte
      <strong>${quoteId}</strong>.
    </p>

    <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
      De offerte is 14 dagen geldig. Voor vragen of opmerkingen kunt u altijd contact met ons opnemen.
    </p>

    <div style="background: #f5f5f5; border-left: 4px solid #d4af37; padding: 14px 16px; margin: 24px 0; border-radius: 2px;">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Dutch Roofing Experts</strong></p>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #444;">Tel: +31 6 45577172</p>
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #444;">E-mail: dutchroofingexperts@yahoo.com</p>
      <p style="margin: 0; font-size: 13px; color: #444;">Costa Blanca South</p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">
      Met vriendelijke groet,<br />
      <strong>Dutch Roofing Experts</strong>
    </p>
  </div>

  <div style="background: #f0f0f0; padding: 12px 24px; font-size: 11px; color: #888; text-align: center;">
    Dit is een automatisch gegenereerd bericht. De offerte is als PDF-bijlage meegestuurd.
  </div>
</div>
      `.trim(),
      attachments: [
        {
          filename: `offerte-${quoteId}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send quote email error:', error);
    return NextResponse.json({ success: false, error: 'Verzenden mislukt.' }, { status: 500 });
  }
}
