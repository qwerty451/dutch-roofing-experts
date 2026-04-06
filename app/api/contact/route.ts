import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, postalCode, serviceType, roofType, description, urgency } = body;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_TO,
      subject: `Nieuw contactformulier: ${urgency === "emergency" ? "NOODGEVAL - " : ""}${name}`,
      text: `
Nieuw bericht via contactformulier

Naam: ${name}
Telefoon: ${phone}
${email ? `E-mail: ${email}` : ""}
${address ? `Adres: ${address}` : ""}
${postalCode ? `Postcode: ${postalCode}` : ""}

Soort dienst: ${serviceType || "Niet gespecificeerd"}
Soort dak: ${roofType || "Niet gespecificeerd"}
Urgentie: ${urgency === "emergency" ? "Noodgeval" : urgency === "soon" ? "Zo snel mogelijk" : "Normaal"}

Bericht:
${description || "Geen bericht ingevuld"}
      `.trim(),
      html: `
<h2>Nieuw bericht via contactformulier</h2>
<p><strong>Naam:</strong> ${name}</p>
<p><strong>Telefoon:</strong> ${phone}</p>
${email ? `<p><strong>E-mail:</strong> ${email}</p>` : ""}
${address ? `<p><strong>Adres:</strong> ${address}</p>` : ""}
${postalCode ? `<p><strong>Postcode:</strong> ${postalCode}</p>` : ""}
<p><strong>Soort dienst:</strong> ${serviceType || "Niet gespecificeerd"}</p>
<p><strong>Soort dak:</strong> ${roofType || "Niet gespecificeerd"}</p>
<p><strong>Urgentie:</strong> ${urgency === "emergency" ? "🚨 NOODGEVAL" : urgency === "soon" ? "Zo snel mogelijk" : "Normaal"}</p>
<hr>
<h3>Bericht:</h3>
<p>${description || "Geen bericht ingevuld"}</p>
      `.trim(),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
