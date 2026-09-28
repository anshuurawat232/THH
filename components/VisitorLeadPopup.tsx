'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { X, Mountain, ArrowRight } from 'lucide-react';
import { BOOKED_SUPPRESSION_KEY, LEAD_PROMPT_STATE_KEY, VisitorLead, VISITOR_LEADS_KEY, readVisitorLeads } from '../lib/visitor-leads';

const INITIAL_DELAY = 5_000;
const REPEAT_DELAY = 10 * 60_000;

type PromptState = { hasPrompted: boolean; nextPromptAt: number; submitted: boolean; promptVisible?: boolean | null };
const readPromptState = (): PromptState => {
  try {
    const saved = JSON.parse(localStorage.getItem(LEAD_PROMPT_STATE_KEY) || '{}');
    return { hasPrompted: Boolean(saved.hasPrompted), nextPromptAt: Number(saved.nextPromptAt) || 0, submitted: Boolean(saved.submitted), promptVisible: typeof saved.promptVisible === 'boolean' ? saved.promptVisible : null };
  } catch { return { hasPrompted: false, nextPromptAt: 0, submitted: false, promptVisible: null }; }
};

export function VisitorLeadPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialVisitScheduled = useRef(false);
  const submittedThisVisit = useRef(false);

  useEffect(() => {
    if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/booking') { setOpen(false); return; }
    const hasBooked = () => localStorage.getItem(BOOKED_SUPPRESSION_KEY) === 'true';
    const current = readPromptState();
    if (hasBooked() || submittedThisVisit.current) { setOpen(false); return; }
    // Start a fresh five-second prompt on each full site visit or browser refresh.
    // Keep the ref so normal in-app route changes do not restart that timer.
    if (!initialVisitScheduled.current) {
      initialVisitScheduled.current = true;
      current.nextPromptAt = Date.now() + INITIAL_DELAY;
      current.submitted = false;
      localStorage.setItem(LEAD_PROMPT_STATE_KEY, JSON.stringify(current));
    }

    const show = () => {
      if (hasBooked()) return;
      const latest = readPromptState();
      if (submittedThisVisit.current) return;
      localStorage.setItem(LEAD_PROMPT_STATE_KEY, JSON.stringify({ ...latest, hasPrompted: true, promptVisible: true, nextPromptAt: Date.now() + REPEAT_DELAY }));
      setOpen(true);
    };
    const wait = Math.max(0, current.nextPromptAt - Date.now());
    timer.current = setTimeout(show, wait);
    const onBooked = () => { if (timer.current) clearTimeout(timer.current); setOpen(false); };
    window.addEventListener('trailora-booking-created', onBooked);
    window.addEventListener('storage', onBooked);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener('trailora-booking-created', onBooked);
      window.removeEventListener('storage', onBooked);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const dismiss = () => {
    setOpen(false);
    const current = readPromptState();
    localStorage.setItem(LEAD_PROMPT_STATE_KEY, JSON.stringify({ ...current, hasPrompted: true, promptVisible: false, nextPromptAt: Date.now() + REPEAT_DELAY }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!cleanPhone && !cleanEmail) { setError('Add a phone number or email so we can reach you.'); return; }
    if (cleanPhone && !/^\+?[0-9 ()-]{8,20}$/.test(cleanPhone)) { setError('Enter a valid phone number, or leave it blank and use your email.'); return; }
    if (cleanEmail && !/^\S+@\S+\.\S+$/.test(cleanEmail)) { setError('Enter a valid email address, or leave it blank and use your phone.'); return; }
    const lead: VisitorLead = { id: `LEAD-${Date.now()}`, name: name.trim(), phone: cleanPhone, email: cleanEmail, destination, createdAt: new Date().toISOString(), sourcePath: pathname, status: 'New' };
    let saved: VisitorLead[] = [];
    try { saved = readVisitorLeads(JSON.parse(localStorage.getItem(VISITOR_LEADS_KEY) || '[]')); } catch { saved = []; }
    localStorage.setItem(VISITOR_LEADS_KEY, JSON.stringify([lead, ...saved]));
    localStorage.setItem(LEAD_PROMPT_STATE_KEY, JSON.stringify({ hasPrompted: true, nextPromptAt: 0, submitted: true, promptVisible: false }));
    submittedThisVisit.current = true;
    setSubmitted(true); setError('');
  };

  if (!open) return null;
  return <div className="lead-overlay" role="presentation"><section className="lead-popup" role="dialog" aria-modal="true" aria-labelledby="lead-popup-title" aria-describedby="lead-popup-description">
    <button className="lead-close" aria-label="Close contact form" onClick={dismiss}><X size={19}/></button>
    {submitted ? <div className="lead-thanks"><span className="lead-icon"><Mountain size={21}/></span><span className="eyebrow">Thanks for reaching out</span><h2 id="lead-popup-title">We’ll be in touch.</h2><p className="muted">Your details have been saved. Start exploring while we prepare your trail suggestions.</p><button className="btn btn-dark" onClick={() => setOpen(false)}>Continue exploring</button></div> : <>
      <Image className="lead-logo" src="/the-himalayan-hikes-mark.png" alt="The Himalayan Hikes" width={48} height={42} priority/><span className="eyebrow">A little help for your next journey</span><h2 id="lead-popup-title">Find your Himalayan trail.</h2><p id="lead-popup-description" className="lead-description">Tell us how to reach you and our team can help you choose a trek.</p>
      <form onSubmit={submit} className="lead-form" noValidate>
        <label>Your name <span>required</span><input className="field" autoComplete="name" maxLength={80} required value={name} onChange={event => setName(event.target.value)} placeholder="Name"/></label>
        <label>Phone number <span>or email</span><input className="field" type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91 98765 43210"/></label>
        <label>Email address <span>or phone</span><input className="field" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com"/></label>
        <label>Destination <span>optional</span><select className="field" value={destination} onChange={event => setDestination(event.target.value)}><option value="">Choose a destination</option><option>Uttarakhand</option><option>Himachal Pradesh</option><option>Nepal</option><option>Sikkim</option><option>Jammu & Kashmir</option><option>Not sure yet</option></select></label>
        {error && <p className="lead-error" role="alert">{error}</p>}
        <button className="btn btn-primary lead-submit" type="submit">Send my enquiry <ArrowRight size={16}/></button>
        <small className="lead-privacy">Share a phone number or email. We’ll use it only to follow up about your trek enquiry.</small>
      </form>
    </>}
  </section></div>;
}
