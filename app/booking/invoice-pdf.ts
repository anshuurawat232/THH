type InvoicePdfData = {
  invoiceId: string; bookingId: string; invoiceDate: string; departure: string;
  name: string; email: string; phone: string; travellers: number;
  trek: string; location: string; region: string; duration: number;
  difficulty: string; altitude: string; distance: string; season: string;
  description: string; highlights: string[]; unitPrice: number; subtotal: number;
  offerPercent: number; offerDiscount: number; couponCode: string;
  couponDiscount: number; total: number;
};

const plain = (value: string | number) => String(value).replace(/₹/g, 'INR ').normalize('NFKD').replace(/[^\x20-\x7e]/g, '').trim();
const escapePdf = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const money = (value: number) => `INR ${Math.max(0, value).toLocaleString('en-IN')}`;

export function downloadInvoicePdf(invoice: InvoicePdfData) {
  const lines: string[] = [
    'THE HIMALAYAN HIKES', 'BOOKING INVOICE', '',
    `Invoice number: ${invoice.invoiceId}`, `Booking reference: ${invoice.bookingId}`,
    `Invoice date: ${invoice.invoiceDate}`, `Booking status: Confirmed - demo booking`,
    `Departure date: ${invoice.departure}`, '', 'TRAVELLER DETAILS',
    `Lead traveller: ${invoice.name}`, `Email: ${invoice.email}`, `Phone: ${invoice.phone}`,
    `Group size: ${invoice.travellers} ${invoice.travellers === 1 ? 'traveller' : 'travellers'}`, '',
    'TREK DETAILS', `Trek: ${invoice.trek}`, `Starting point: ${invoice.location}, ${invoice.region}`,
    `Duration: ${invoice.duration} days`, `Difficulty: ${invoice.difficulty}`,
    `Highest altitude: ${invoice.altitude}`, `Trail distance: ${invoice.distance}`,
    `Best season: ${invoice.season}`, '', 'ABOUT THIS TREK', invoice.description, '',
    'HIGHLIGHTS', ...invoice.highlights.map(item => `- ${item}`), '', 'PRICE BREAKDOWN',
    `Trek package: ${invoice.travellers} x ${money(invoice.unitPrice)} = ${money(invoice.subtotal)}`,
    ...(invoice.offerDiscount > 0 ? [`Trek offer (${invoice.offerPercent}%): - ${money(invoice.offerDiscount)}`] : []),
    ...(invoice.couponDiscount > 0 ? [`Coupon ${invoice.couponCode}: - ${money(invoice.couponDiscount)}`] : [`Coupon: ${invoice.couponCode || 'None applied'}`]),
    'Taxes and fees: Not charged in this demo', `AMOUNT DUE: ${money(invoice.total)}`, '',
    'Payment status: No payment has been collected or processed.',
    'This is a demo booking invoice and is not a tax receipt.', '',
    'Thank you for choosing the mountains.', 'The Himalayan Hikes',
  ];
  const wrapped = lines.flatMap(line => {
    let normalized = plain(line);
    if (!normalized) return [''];
    const result: string[] = [];
    while (normalized.length > 92) {
      let split = normalized.lastIndexOf(' ', 92);
      if (split < 1) split = 92;
      result.push(normalized.slice(0, split));
      normalized = normalized.slice(split).trimStart();
    }
    result.push(normalized);
    return result;
  });
  const pageLines = 47;
  const chunks = Array.from({ length: Math.ceil(wrapped.length / pageLines) }, (_, index) => wrapped.slice(index * pageLines, (index + 1) * pageLines));
  const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageRefs: number[] = [];
  chunks.forEach((chunk, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    pageRefs.push(pageId);
    const commands = [
      'BT /F1 17 Tf 54 790 Td (THE HIMALAYAN HIKES) Tj ET',
      'BT /F1 10 Tf 54 771 Td (BOOKING INVOICE) Tj ET',
      '0.75 w 54 758 m 541 758 l S',
      ...chunk.map((line, row) => `BT /F1 9 Tf 54 ${739 - row * 14} Td (${escapePdf(line)}) Tj ET`),
      `BT /F1 9 Tf 54 35 Td (The Himalayan Hikes  |  Page ${index + 1} of ${chunks.length}) Tj ET`,
    ].join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageRefs.map(id => `${id} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${invoice.invoiceId.replace(/[^a-z0-9-]/gi, '-')}.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
