'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Search, Users } from 'lucide-react';
import { treks } from '../lib/data';
import { BOOKINGS_STORAGE_KEY, readStoredBookings, StoredBooking } from '../lib/bookings';
import { downloadInvoicePdf } from '../app/booking/invoice-pdf';

const money = (amount: number) => `₹${Math.max(0, amount).toLocaleString('en-IN')}`;
const dateText = (date: string) => date ? new Date(`${date.slice(0,10)}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Not set';
const csvCell = (value: unknown) => {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function AdminBookings() {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [query, setQuery] = useState('');
  const [emailingId, setEmailingId] = useState('');
  const [message, setMessage] = useState('');

  const refresh = () => {
    try { setBookings(readStoredBookings(JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]'))); }
    catch { setBookings([]); }
  };
  useEffect(() => {
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return bookings.filter(booking => !term || [booking.id, booking.trekName, booking.traveller.name, booking.traveller.email, booking.traveller.phone].some(value => String(value || '').toLowerCase().includes(term)));
  }, [bookings, query]);

  const exportCsv = () => {
    const columns = ['Booking reference','Invoice number','Booking status','Payment status','Booking date','Departure date','Trek','Region','Traveller name','Email','Phone','Travellers','Subtotal INR','Discount INR','Coupon','Total INR','Invoice email status'];
    const lines = [columns, ...filtered.map(booking => [booking.id, `THH-${booking.id}`, booking.status, booking.paymentStatus || 'Not collected · demo checkout', booking.createdAt, booking.date, booking.trekName, booking.trekSnapshot?.region || treks.find(trek => trek.slug === booking.trek)?.region || '', booking.traveller.name, booking.traveller.email, booking.traveller.phone, booking.people, booking.subtotal ?? ((booking.total || 0) + (booking.discount || 0)), booking.discount || 0, booking.coupon || '', booking.total, booking.invoiceEmailStatus || 'Not sent'])].map(row => row.map(csvCell).join(','));
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'the-himalayan-hikes-bookings.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const updateEmailStatus = (id: string, status: 'Sending' | 'Sent' | 'Failed') => {
    const next = bookings.map(booking => booking.id === id ? { ...booking, invoiceEmailStatus: status } : booking);
    setBookings(next);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(next));
  };

  const resendInvoice = async (booking: StoredBooking) => {
    setEmailingId(booking.id); setMessage(''); updateEmailStatus(booking.id, 'Sending');
    const trek = treks.find(item => item.slug === booking.trek);
    const snapshot = booking.trekSnapshot;
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: booking.traveller.email, invoiceId: `THH-${booking.id}`, bookingId: booking.id, traveller: booking.traveller.name, phone: booking.traveller.phone, trek: booking.trekName || trek?.name || 'Himalayan trek', region: snapshot?.region || trek?.region || 'Himalayas', location: snapshot?.location || trek?.location || '', duration: snapshot?.days || trek?.days || 0, difficulty: snapshot?.difficulty || trek?.difficulty || '', altitude: snapshot?.altitude || trek?.altitude || '', distance: snapshot?.distance || trek?.distance || '', season: snapshot?.season || trek?.season || '', description: snapshot?.description || trek?.description || '', highlights: snapshot?.highlights || trek?.highlights || [], departure: booking.date, travellers: booking.people, subtotal: booking.subtotal ?? booking.total + (booking.discount || 0), offerDiscount: booking.offerDiscount || 0, couponCode: booking.coupon || '', couponDiscount: booking.couponDiscount || 0, discount: booking.discount || 0, total: booking.total }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invoice email could not be sent.');
      updateEmailStatus(booking.id, 'Sent'); setMessage(`Invoice sent to ${booking.traveller.email}.`);
    } catch (reason) {
      updateEmailStatus(booking.id, 'Failed'); setMessage(reason instanceof Error ? reason.message : 'Invoice email could not be sent.');
    } finally { setEmailingId(''); }
  };

  const download = (booking: StoredBooking) => {
    const trek = treks.find(item => item.slug === booking.trek);
    const snapshot = booking.trekSnapshot;
    const departure = dateText(booking.date);
    downloadInvoicePdf({ invoiceId: `THH-${booking.id}`, bookingId: booking.id, invoiceDate: booking.invoiceDate ? new Date(booking.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : dateText(booking.createdAt), departure, name: booking.traveller.name, email: booking.traveller.email, phone: booking.traveller.phone, travellers: booking.people, trek: booking.trekName || trek?.name || 'Himalayan trek', location: snapshot?.location || trek?.location || 'To be confirmed', region: snapshot?.region || trek?.region || '', duration: snapshot?.days || trek?.days || 0, difficulty: snapshot?.difficulty || trek?.difficulty || '', altitude: snapshot?.altitude || trek?.altitude || '', distance: snapshot?.distance || trek?.distance || '', season: snapshot?.season || trek?.season || '', description: snapshot?.description || trek?.description || '', highlights: snapshot?.highlights || trek?.highlights || [], unitPrice: booking.unitPrice ?? trek?.price ?? booking.total, subtotal: booking.subtotal ?? booking.total + (booking.discount || 0), offerPercent: booking.offerPercent || 0, offerDiscount: booking.offerDiscount || 0, couponCode: booking.coupon || '', couponDiscount: booking.couponDiscount || 0, total: booking.total });
  };

  const attendeeCount = bookings.reduce((sum, booking) => sum + booking.people, 0);
  return <section className="admin-bookings-panel" id="admin-bookings">
    <div className="admin-section-heading"><div><span className="eyebrow">Customer operations</span><h2 className="section-title">Bookings, clients & invoices</h2><p className="muted">Review customer details, trip plans, invoice totals and invoice email status.</p></div><button className="btn btn-outline" onClick={exportCsv} disabled={!filtered.length}><Download size={16}/> Export CSV</button></div>
    <div className="notice admin-storage-note">This demo keeps bookings in the browser where the booking was made. It does not process or record real payments. Do not use this local admin page as a production customer database.</div>
    <div className="admin-booking-stats"><div><b>{bookings.length}</b><span>Bookings</span></div><div><b>{attendeeCount}</b><span>Travellers</span></div><div><b>{bookings.filter(item => item.invoiceEmailStatus === 'Sent').length}</b><span>Invoice emails sent</span></div><div><b>{bookings.filter(item => item.invoiceEmailStatus === 'Failed').length}</b><span>Email issues</span></div></div>
    <label className="admin-booking-search"><Search size={17}/><input aria-label="Search bookings" className="field" placeholder="Search by client, email, trek or reference" value={query} onChange={event => setQuery(event.target.value)}/></label>
    {message && <p className="invoice-email-message" role="status">{message}</p>}
    {filtered.length ? <div className="admin-booking-list">{filtered.map(booking => {
      const trek = treks.find(item => item.slug === booking.trek);
      const snapshot = booking.trekSnapshot;
      return <details className="admin-booking-card" key={booking.id}>
        <summary><span className="admin-booking-main"><b>{booking.traveller.name}</b><small>{booking.traveller.email} · {booking.trekName || trek?.name || 'Himalayan trek'}</small></span><span className="admin-booking-ref">{booking.id}<small>{dateText(booking.date)}</small></span><span className="admin-booking-total">{money(booking.total)}<small>{booking.status}</small></span></summary>
        <div className="admin-booking-detail">
          <div className="admin-data-grid"><div><span>Client name</span><b>{booking.traveller.name}</b></div><div><span>Email</span><b>{booking.traveller.email || 'Not supplied'}</b></div><div><span>Phone</span><b>{booking.traveller.phone || 'Not supplied'}</b></div><div><span>Travellers</span><b><Users size={14}/> {booking.people}</b></div><div><span>Booking reference</span><b>{booking.id}</b></div><div><span>Invoice number</span><b>THH-{booking.id}</b></div><div><span>Booking created</span><b>{dateText(booking.createdAt)}</b></div><div><span>Departure date</span><b>{dateText(booking.date)}</b></div><div><span>Booking status</span><b>{booking.status}</b></div><div><span>Payment status</span><b>{booking.paymentStatus || 'Not collected · demo checkout'}</b></div><div><span>Invoice email</span><b>{booking.invoiceEmailStatus || 'Not sent'}</b></div><div><span>Coupon</span><b>{booking.coupon || 'None used'}</b></div></div>
          <section className="admin-invoice-preview"><div className="row"><div><span className="eyebrow">The Himalayan Hikes · invoice</span><h3>{booking.trekName || trek?.name || 'Himalayan trek'}</h3><p className="muted">{snapshot?.location || trek?.location || 'Trailhead not recorded'} · {snapshot?.region || trek?.region || 'Himalayas'} · {snapshot?.days || trek?.days || '—'} days</p></div><b className="price">{money(booking.total)}</b></div><p>{snapshot?.description || trek?.description || 'Trek description was not saved with this older booking.'}</p><div className="admin-invoice-lines"><div><span>Package · {booking.people} traveller{booking.people===1?'':'s'} × {money(booking.unitPrice ?? trek?.price ?? booking.total)}</span><b>{money(booking.subtotal ?? booking.total + (booking.discount || 0))}</b></div>{(booking.offerDiscount || 0) > 0 && <div><span>Trek offer · {booking.offerPercent || 0}%</span><b>− {money(booking.offerDiscount || 0)}</b></div>}{(booking.couponDiscount || 0) > 0 && <div><span>Coupon · {booking.coupon}</span><b>− {money(booking.couponDiscount || 0)}</b></div>}<div><span>Taxes & fees</span><b>Not charged · demo</b></div><div className="admin-invoice-total"><span>Amount due</span><b>{money(booking.total)}</b></div><small>Payment not collected. This is a demo booking invoice, not a payment receipt.</small></div></section>
          <div className="admin-booking-actions"><button className="btn btn-primary" onClick={() => download(booking)}><Download size={16}/> Download invoice PDF</button><button className="btn btn-outline" onClick={() => void resendInvoice(booking)} disabled={emailingId === booking.id || !booking.traveller.email}><Mail size={16}/>{emailingId === booking.id ? 'Sending…' : 'Resend invoice email'}</button></div>
        </div>
      </details>;
    })}</div> : <div className="card pad admin-empty-bookings"><h3>{bookings.length ? 'No bookings match your search.' : 'No bookings saved in this browser yet.'}</h3><p className="muted">New bookings made on this device will appear here with the traveller details and invoice snapshot.</p></div>}
  </section>;
}
