import { NextRequest, NextResponse } from 'next/server';

type InvoiceEmail = {
  to: string;
  invoiceId: string;
  bookingId: string;
  traveller: string;
  phone: string;
  trek: string;
  region: string;
  location: string;
  duration: number;
  difficulty: string;
  altitude: string;
  distance: string;
  season: string;
  description: string;
  highlights: string[];
  departure: string;
  travellers: number;
  subtotal: number;
  offerDiscount: number;
  couponCode: string;
  couponDiscount: number;
  discount: number;
  total: number;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;
  if (!apiKey || !from) return NextResponse.json({ error: 'Invoice email is not configured. Set RESEND_API_KEY and INVOICE_FROM_EMAIL on the server.' }, { status: 503 });

  let invoice: InvoiceEmail;
  try { invoice = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid invoice request.' }, { status: 400 }); }

  if (!invoice || typeof invoice.to !== 'string' || invoice.to.length > 254 || !/^\S+@\S+\.\S+$/.test(invoice.to) || !invoice.invoiceId || !invoice.trek || !Number.isFinite(invoice.total) || invoice.total < 0) {
    return NextResponse.json({ error: 'The invoice is missing valid recipient or booking details.' }, { status: 400 });
  }

  const safe = {
    name: escapeHtml(String(invoice.traveller || 'Trekker')),
    phone: escapeHtml(String(invoice.phone || 'Not provided')),
    trek: escapeHtml(String(invoice.trek)),
    region: escapeHtml(String(invoice.region || 'Himalayas')),
    location: escapeHtml(String(invoice.location || '')),
    duration: escapeHtml(String(invoice.duration || '')),
    difficulty: escapeHtml(String(invoice.difficulty || '')),
    altitude: escapeHtml(String(invoice.altitude || '')),
    distance: escapeHtml(String(invoice.distance || '')),
    season: escapeHtml(String(invoice.season || '')),
    description: escapeHtml(String(invoice.description || '')),
    highlights: Array.isArray(invoice.highlights) ? invoice.highlights.map(value => escapeHtml(String(value))).join(' · ') : '',
    departure: escapeHtml(String(invoice.departure || 'To be confirmed')),
    invoiceId: escapeHtml(String(invoice.invoiceId)),
    bookingId: escapeHtml(String(invoice.bookingId)),
    couponCode: escapeHtml(String(invoice.couponCode || 'None applied')),
  };
  const money = (amount: number) => `₹${Math.max(0, Math.round(Number(amount) || 0)).toLocaleString('en-IN')}`;
  const rows = [
    `<tr><td>${safe.trek} × ${Math.max(1, Number(invoice.travellers) || 1)}<br><small>${safe.location}, ${safe.region} · departure ${safe.departure}</small></td><td>${money(invoice.subtotal)}</td></tr>`,
    Number(invoice.offerDiscount) > 0 ? `<tr><td>Trek offer</td><td>− ${money(invoice.offerDiscount)}</td></tr>` : '',
    Number(invoice.couponDiscount) > 0 ? `<tr><td>Coupon ${safe.couponCode}</td><td>− ${money(invoice.couponDiscount)}</td></tr>` : '',
    `<tr><td>Taxes and fees</td><td>Not charged</td></tr>`,
    `<tr><td><strong>Invoice total</strong></td><td><strong>${money(invoice.total)}</strong></td></tr>`,
  ].filter(Boolean).join('');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [invoice.to],
        subject: `Your ${invoice.trek} booking invoice · ${invoice.invoiceId}`,
        html: `<div style="font-family:Arial,sans-serif;color:#25211f;max-width:680px;margin:auto"><div style="background:#691e27;color:white;padding:24px 28px;border-radius:16px 16px 0 0"><small>THE HIMALAYAN HIKES</small><h1 style="margin:10px 0 0">Booking invoice</h1></div><div style="padding:26px;border:1px solid #eee4de;border-radius:0 0 16px 16px"><p>Hello ${safe.name},</p><p>Here is the invoice for your Himalayan Hikes booking.</p><p><b>Invoice:</b> ${safe.invoiceId}<br><b>Booking:</b> ${safe.bookingId}<br><b>Status:</b> Confirmed · demo booking<br><b>Departure:</b> ${safe.departure}</p><h2 style="font-size:17px">Traveller and trek details</h2><p><b>Traveller:</b> ${safe.name}<br><b>Email:</b> ${escapeHtml(invoice.to)}<br><b>Phone:</b> ${safe.phone}<br><b>Party size:</b> ${Math.max(1, Number(invoice.travellers) || 1)}<br><b>Trailhead:</b> ${safe.location}, ${safe.region}<br><b>Duration:</b> ${safe.duration} days<br><b>Difficulty:</b> ${safe.difficulty}<br><b>Highest altitude:</b> ${safe.altitude}<br><b>Distance:</b> ${safe.distance}<br><b>Best season:</b> ${safe.season}<br><b>Coupon:</b> ${safe.couponCode}</p><p>${safe.description}</p>${safe.highlights ? `<p><b>Trek highlights:</b> ${safe.highlights}</p>` : ''}<table style="width:100%;border-collapse:collapse"><thead><tr><th align="left" style="padding:12px 0;border-bottom:1px solid #ddd">Adventure and price breakdown (INR)</th><th align="right" style="padding:12px 0;border-bottom:1px solid #ddd">Amount</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:24px;color:#666">This is a demo booking invoice; no payment was collected through this website.</p><p style="margin-top:28px;padding-top:18px;border-top:1px solid #eee;color:#691e27;font-weight:bold">The Himalayan Hikes</p></div></div>`,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: 'The email provider could not deliver this invoice. Check the sender configuration and try again.' }, { status: 502 });
    return NextResponse.json({ sent: true, id: result.id });
  } catch {
    return NextResponse.json({ error: 'The invoice email could not be sent right now. Please try again.' }, { status: 502 });
  }
}
