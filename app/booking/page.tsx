'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Check, Tag } from 'lucide-react';
import { treks } from '../../lib/data';
import { DEFAULT_PROMOTIONS, normalizePromotions, PROMOTION_STORAGE_KEY, PromotionSettings, readPromotions } from '../../lib/promotions';
import { downloadInvoicePdf } from './invoice-pdf';
import { BOOKINGS_STORAGE_KEY } from '../../lib/bookings';
import { BOOKED_SUPPRESSION_KEY } from '../../lib/visitor-leads';

type Traveller = { name: string; phone: string; email: string };

export default function Booking() {
  return <Suspense fallback={<section className="section"><div className="container">Loading your trek…</div></section>}><BookingForm /></Suspense>;
}

function BookingForm() {
  const query = useSearchParams();
  const [trek, setTrek] = useState(() => treks.find(item => item.slug === query.get('trek')) || treks[0]);
  const [promotions, setPromotions] = useState<PromotionSettings>(DEFAULT_PROMOTIONS);
  const [step, setStep] = useState(1);
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState('');
  const [done, setDone] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState('');
  const [details, setDetails] = useState<Traveller>({ name: '', phone: '', email: '' });
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [error, setError] = useState('');
  const [emailState, setEmailState] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');
  const automaticEmailStarted = useRef(false);
  const [bookingId] = useState(() => `HH-${Math.floor(Math.random() * 90000 + 10000)}`);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROMOTION_STORAGE_KEY);
      setPromotions(saved ? normalizePromotions(JSON.parse(saved)) : readPromotions());
    } catch { setPromotions(DEFAULT_PROMOTIONS); }
  }, []);

  const trekImage = promotions.trekImages[trek.slug] || trek.image;
  const offerPercent = promotions.trekOffers[trek.slug] ?? promotions.sitewidePercent;
  const matchingCoupon = promotions.coupons.find(item => item.active && item.code === appliedCoupon);
  const offerSaving = Math.round(trek.price * offerPercent / 100);
  const couponSaving = matchingCoupon ? Math.min(trek.price - offerSaving, matchingCoupon.type === 'percent' ? Math.round((trek.price - offerSaving) * matchingCoupon.value / 100) : matchingCoupon.value) : 0;
  const pricePerPerson = Math.max(0, trek.price - offerSaving - couponSaving);
  const total = pricePerPerson * people;

  const applyCoupon = (event: FormEvent) => {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    const match = promotions.coupons.find(item => item.code === code && item.active);
    if (!match) {
      setAppliedCoupon('');
      setCouponMessage('That coupon is not active or was not recognized.');
      return;
    }
    setAppliedCoupon(code);
    setCouponMessage(`${code} applied successfully.`);
  };

  const continueBooking = () => {
    setError('');
    if (step === 2 && !date) { setError('Choose your preferred departure date to continue.'); return; }
    if (step === 3 && (!details.name.trim() || !/^\+?[0-9 ()-]{8,}$/.test(details.phone) || !/^\S+@\S+\.\S+$/.test(details.email))) {
      setError('Enter your name, a valid phone number and email address.'); return;
    }
    setStep(current => current + 1);
  };

  const updateDetails = (key: keyof Traveller, value: string) => setDetails(current => ({ ...current, [key]: value }));

  const updateInvoiceEmailStatus = (status: 'Sending' | 'Sent' | 'Failed') => {
    try {
      const bookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
      if (Array.isArray(bookings)) localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings.map(booking => booking.id === bookingId ? { ...booking, invoiceEmailStatus: status } : booking)));
    } catch { /* Booking history is best-effort in this browser demo. */ }
  };

  const confirmBooking = () => {
    const timestamp = new Date().toISOString();
    const booking = { id: bookingId, invoiceId: `THH-${bookingId}`, trek: trek.slug, trekName: trek.name, date, people, traveller: details, total, subtotal: trek.price * people, unitPrice: trek.price, offerPercent, offerDiscount: offerSaving * people, coupon: matchingCoupon?.code || '', couponDiscount: couponSaving * people, discount: trek.price * people - total, createdAt: timestamp, invoiceDate: timestamp, status: 'Confirmed', paymentStatus: 'Not collected · demo checkout', invoiceEmailStatus: 'Sending', trekSnapshot: { region: trek.region, location: trek.location, days: trek.days, difficulty: trek.difficulty, altitude: trek.altitude, distance: trek.distance, season: trek.season, description: trek.description, highlights: trek.highlights } };
    try {
      const current = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify([booking, ...(Array.isArray(current) ? current : [])]));
    } catch { localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify([booking])); }
    localStorage.setItem(BOOKED_SUPPRESSION_KEY, 'true');
    window.dispatchEvent(new Event('trailora-booking-created'));
    setConfirmedAt(timestamp);
    setDone(true);
  };

  const emailInvoice = async () => {
    updateInvoiceEmailStatus('Sending');
    setEmailState('sending');
    setEmailMessage('Sending invoice to ' + details.email + '…');
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: details.email, invoiceId: `THH-${bookingId}`, bookingId, traveller: details.name, phone: details.phone, trek: trek.name, region: trek.region, location: trek.location, duration: trek.days, difficulty: trek.difficulty, altitude: trek.altitude, distance: trek.distance, season: trek.season, description: trek.description, highlights: trek.highlights, departure: date, travellers: people, subtotal: trek.price * people, offerDiscount: offerSaving * people, couponCode: matchingCoupon?.code || '', couponDiscount: couponSaving * people, discount: trek.price * people - total, total }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send the invoice.');
      updateInvoiceEmailStatus('Sent');
      setEmailState('sent');
      setEmailMessage('Invoice emailed to ' + details.email + '.');
    } catch (reason) {
      updateInvoiceEmailStatus('Failed');
      setEmailState('error');
      setEmailMessage(reason instanceof Error ? reason.message : 'Could not send the invoice. Please try again.');
    }
  };

  useEffect(() => {
    if (done && !automaticEmailStarted.current) {
      automaticEmailStarted.current = true;
      void emailInvoice();
    }
  }, [done]);

  if (done) return <section className="section invoice-section"><div className="container invoice-wrap"><div className="booking-success-banner"><div className="booking-success-icon"><Check size={27}/></div><div><span className="eyebrow">Booking confirmed</span><h1>You’re going trekking!</h1><p className="muted">We’re sending your invoice to {details.email}. Download the invoice as a PDF any time.</p></div></div><article className="invoice-document"><header className="invoice-header"><div className="invoice-brand"><Image src="/himalayan-hikes-logo.png" alt="The Himalayan Hikes logo" width={54} height={54}/><div><b>The Himalayan Hikes</b><span>Himalayan trekking experiences</span></div></div><div className="invoice-title"><span>BOOKING INVOICE</span><b>THH-{bookingId}</b></div></header><div className="invoice-meta"><div><span>Invoice date</span><b>{confirmedAt ? new Date(confirmedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Today'}</b></div><div><span>Booking reference</span><b>{bookingId}</b></div><div><span>Departure date</span><b>{new Date(`${date}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</b></div><div className="invoice-meta-status"><span>Booking status</span><b>Confirmed · demo booking</b></div></div><section className="invoice-trip-details"><div><span>Starting point</span><b>{trek.location}, {trek.region}</b></div><div><span>Duration</span><b>{trek.days} days</b></div><div><span>Difficulty</span><b>{trek.difficulty}</b></div><div><span>Highest altitude</span><b>{trek.altitude}</b></div><div><span>Trail distance</span><b>{trek.distance}</b></div><div><span>Best season</span><b>{trek.season}</b></div></section><div className="invoice-customer"><div><span>Traveller</span><b>{details.name}</b><small>{details.email}</small></div><div><span>Contact</span><b>{details.phone}</b><small>{people} {people===1?'traveller':'travellers'}</small></div></div><section className="invoice-trip-summary"><span className="invoice-section-label">About this trek</span><p>{trek.description}</p><div className="invoice-highlights">{trek.highlights.map(highlight=><span key={highlight}>{highlight}</span>)}</div></section><div className="invoice-table"><div className="invoice-table-head"><span>Adventure / unit price</span><span>Quantity · line total</span></div><div className="invoice-line"><div><b>{trek.name}</b><small>{trek.location}, {trek.region} · ₹{trek.price.toLocaleString('en-IN')} per traveller</small></div><b>{people} × · ₹{(trek.price*people).toLocaleString('en-IN')}</b></div>{offerSaving>0&&<div className="invoice-line invoice-discount"><span>Trek offer ({offerPercent}%)</span><b>− ₹{(offerSaving*people).toLocaleString('en-IN')}</b></div>}{couponSaving>0&&<div className="invoice-line invoice-discount"><span>Coupon ({matchingCoupon?.code})</span><b>− ₹{(couponSaving*people).toLocaleString('en-IN')}</b></div>}<div className="invoice-line invoice-fees"><span>Taxes and fees</span><b>Not charged in this demo</b></div><div className="invoice-line invoice-coupon-status"><span>Coupon used</span><b>{matchingCoupon?.code||'None applied'}</b></div><div className="invoice-total"><span>Amount due · INR</span><b>₹{total.toLocaleString('en-IN')}</b></div></div><p className="invoice-note">Demo booking invoice. No payment has been collected or processed.</p><footer className="invoice-brand-footer"><span>Thank you for choosing the mountains.</span><b>The Himalayan Hikes</b></footer></article><div className="invoice-actions"><button className="btn btn-primary" onClick={()=>downloadInvoicePdf({invoiceId:`THH-${bookingId}`,bookingId,invoiceDate:confirmedAt?new Date(confirmedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'Today',departure:new Date(`${date}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),name:details.name,email:details.email,phone:details.phone,travellers:people,trek:trek.name,location:trek.location,region:trek.region,duration:trek.days,difficulty:trek.difficulty,altitude:trek.altitude,distance:trek.distance,season:trek.season,description:trek.description,highlights:trek.highlights,unitPrice:trek.price,subtotal:trek.price*people,offerPercent,offerDiscount:offerSaving*people,couponCode:matchingCoupon?.code||'',couponDiscount:couponSaving*people,total})}>Download invoice PDF</button><button className="btn btn-outline" onClick={()=>window.print()}>Print invoice</button><button className="btn btn-outline" onClick={emailInvoice} disabled={emailState==='sending'||emailState==='sent'}>{emailState==='sending'?'Sending invoice…':emailState==='sent'?'Invoice emailed':emailState==='error'?'Retry invoice email':'Email invoice'}</button><Link className="btn btn-outline" href="/account">View my trips</Link><Link className="invoice-back-link" href="/treks">Explore more treks</Link></div>{emailMessage&&<p className={`invoice-email-message ${emailState}`} role="status">{emailMessage}</p>}</div></section>;

  return <section className="section booking-page"><div className="container" style={{ maxWidth: 940 }}>
    <div className="booking-heading"><span className="eyebrow">The Himalayan Hikes · Booking</span><h1 className="title">Your mountain story starts here.</h1><p className="muted">Choose your route and departure. Your selected trek stays in view while you book.</p></div>
    <div className="booking-visual" key={trek.slug}>
      <img src={trekImage} alt={`${trek.name} mountain landscape`} />
      <div className="booking-visual-shade" />
      <div className="booking-visual-copy"><span className="booking-image-label">{trek.region} · {trek.days} days</span><h2>{trek.name}</h2><p>{trek.location} · {trek.altitude} · {trek.difficulty}</p><Link href={`/treks/${trek.slug}`} className="booking-detail-link">Explore trek details <span aria-hidden="true">↗</span></Link></div>
      <div className="booking-image-badge">{offerPercent > 0 ? <><b>{offerPercent}% OFF</b><span>On this trek</span></> : <><b>Find your trail</b><span>Made for the mountains</span></>}</div>
    </div>
    <div className="booking-progress-label"><span>Step {step} of 4</span><b>{['Choose trek', 'Dates & group', 'Your details', 'Review'][step - 1]}</b></div><div className="progress"><span style={{ width: `${step / 4 * 100}%` }} /></div>

    <div className="card pad booking-form-card" style={{ marginTop: 22 }}>
      {step === 1 && <><div className="booking-step-title"><span className="eyebrow">01 · Choose your adventure</span><h2>Select your trek</h2></div><label className="field-label" htmlFor="booking-trek">Available treks</label><select id="booking-trek" className="field" value={trek.id} onChange={event => { setTrek(treks.find(item => item.id === event.target.value)!); setAppliedCoupon(''); setCouponMessage(''); }}>
        {treks.map(item => <option value={item.id} key={item.id}>{item.name} — ₹{item.price.toLocaleString('en-IN')}</option>)}
      </select><div className="booking-overview"><div><h3>{trek.name}</h3><p className="muted">{trek.days} days · {trek.difficulty} · {trek.altitude} · {trek.distance}</p><p>{trek.description}</p><Link className="text-link" href={`/treks/${trek.slug}`}>Read full trek details →</Link></div><div className="booking-price-box"><span className="muted">Per traveller</span>{offerSaving > 0 && <del>₹{trek.price.toLocaleString('en-IN')}</del>}<b className="price">₹{pricePerPerson.toLocaleString('en-IN')}</b>{offerSaving > 0 && <small className="saving-text">₹{offerSaving.toLocaleString('en-IN')} trek offer applied</small>}</div></div>
      <form className="coupon-form" onSubmit={applyCoupon}><label className="field-label" htmlFor="booking-coupon"><Tag size={16}/> Have a coupon?</label><div className="coupon-controls"><input id="booking-coupon" className="field" placeholder="Enter coupon code" value={couponInput} onChange={event => setCouponInput(event.target.value.toUpperCase())}/><button className="btn btn-outline" type="submit">Apply code</button></div>{couponMessage && <p className={matchingCoupon ? 'coupon-success' : 'coupon-error'} role="status">{matchingCoupon ? <Check size={15}/> : null}{couponMessage}</p>}</form>
      </>}

      {step === 2 && <><div className="booking-step-title"><span className="eyebrow">02 · Plan your dates</span><h2>When would you like to go?</h2></div><label className="field-label" htmlFor="departure-date">Preferred departure date</label><input id="departure-date" className="field" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)}/><label className="field-label booking-travellers-label" htmlFor="traveller-count">Number of travellers</label><input id="traveller-count" className="field" type="number" min="1" max="15" value={people} onChange={event => setPeople(Math.max(1, Math.min(15, Number(event.target.value) || 1)))}/></>}

      {step === 3 && <><div className="booking-step-title"><span className="eyebrow">03 · Lead traveller</span><h2>Who’s coming along?</h2></div><input className="field" autoComplete="name" placeholder="Full name *" value={details.name} onChange={event => updateDetails('name', event.target.value)}/><input className="field booking-spaced-field" autoComplete="tel" placeholder="Phone number *" type="tel" value={details.phone} onChange={event => updateDetails('phone', event.target.value)}/><input className="field booking-spaced-field" autoComplete="email" placeholder="Email address *" type="email" value={details.email} onChange={event => updateDetails('email', event.target.value)}/></>}

      {step === 4 && <><div className="booking-step-title"><span className="eyebrow">04 · One last look</span><h2>Review your booking</h2></div><div className="notice">Demo checkout — no real payment is processed.</div><div className="booking-review"><div className="row"><span>{trek.name} × {people}</span><b>₹{(trek.price * people).toLocaleString('en-IN')}</b></div>{offerSaving > 0 && <div className="row"><span>Trek offer · {offerPercent}%</span><b className="saving-text">− ₹{(offerSaving * people).toLocaleString('en-IN')}</b></div>}{couponSaving > 0 && <div className="row"><span>Coupon · {matchingCoupon?.code}</span><b className="saving-text">− ₹{(couponSaving * people).toLocaleString('en-IN')}</b></div>}<div className="row"><span>Departure</span><b>{date}</b></div><div className="row"><span>Lead traveller</span><b>{details.name}</b></div><div className="row booking-total"><span>Total</span><b>₹{total.toLocaleString('en-IN')}</b></div></div></>}

      {error && <p role="alert" className="booking-error">{error}</p>}
      <div className="modal-actions"><button className="btn btn-outline" disabled={step === 1} onClick={() => { setError(''); setStep(current => current - 1); }}>Back</button>{step < 4 ? <button className="btn btn-dark" onClick={continueBooking}>Continue</button> : <button className="btn btn-primary" onClick={confirmBooking}>Confirm booking · ₹{total.toLocaleString('en-IN')}</button>}</div>
    </div>
  </div></section>;
}
