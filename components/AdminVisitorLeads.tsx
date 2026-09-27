'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Mail, Phone, Search, Trash2 } from 'lucide-react';
import { readVisitorLeads, VisitorLead, VISITOR_LEADS_KEY } from '../lib/visitor-leads';

const cell = (value: unknown) => {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function AdminVisitorLeads() {
  const [leads, setLeads] = useState<VisitorLead[]>([]);
  const [query, setQuery] = useState('');
  const refresh = () => { try { setLeads(readVisitorLeads(JSON.parse(localStorage.getItem(VISITOR_LEADS_KEY) || '[]'))); } catch { setLeads([]); } };
  useEffect(() => { refresh(); window.addEventListener('storage', refresh); return () => window.removeEventListener('storage', refresh); }, []);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return leads.filter(lead => !term || [lead.name, lead.email, lead.phone, lead.destination, lead.sourcePath].some(value => value.toLowerCase().includes(term)));
  }, [leads, query]);

  const exportCsv = () => {
    const rows = [['Name','Phone','Email','Destination','Received','Page'], ...filtered.map(lead => [lead.name,lead.phone,lead.email,lead.destination,lead.createdAt,lead.sourcePath])];
    const csv = `\uFEFF${rows.map(row => row.map(cell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href=url; anchor.download='the-himalayan-hikes-enquiries.csv'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const remove = (id: string) => {
    const next = leads.filter(lead => lead.id !== id);
    setLeads(next); localStorage.setItem(VISITOR_LEADS_KEY, JSON.stringify(next));
  };

  return <section id="admin-visitor-leads" className="admin-leads-panel">
    <div className="admin-section-heading"><div><span className="eyebrow">New visitor enquiries</span><h2 className="section-title">Popup contact leads <span className="tag">{leads.length}</span></h2><p className="muted">Contact requests captured by the 10-second website popup.</p></div><button className="btn btn-outline" onClick={exportCsv} disabled={!filtered.length}><Download size={16}/> Export CSV</button></div>
    <div className="notice admin-storage-note">Leads are saved in this browser for the demo. New leads from other visitors and devices need a shared, secure server database.</div>
    <label className="admin-booking-search"><Search size={17}/><input aria-label="Search visitor enquiries" className="field" placeholder="Search by name, phone or email" value={query} onChange={event => setQuery(event.target.value)}/></label>
    {filtered.length ? <div className="admin-lead-list">{filtered.map(lead => <article className="admin-lead-card" key={lead.id}><div className="admin-lead-avatar" aria-hidden="true">{lead.name.trim().charAt(0).toUpperCase() || 'H'}</div><div className="admin-lead-info"><div className="row"><b>{lead.name || 'Name not provided'}</b><span className="tag">New enquiry</span></div><div className="admin-lead-contact">{lead.phone && <a href={`tel:${lead.phone}`}><Phone size={15}/>{lead.phone}</a>}{lead.email && <a href={`mailto:${lead.email}`}><Mail size={15}/>{lead.email}</a>}</div>{lead.destination && <small>Interested in: <b>{lead.destination}</b></small>}<small className="muted">{new Date(lead.createdAt).toLocaleString('en-IN')} · from {lead.sourcePath}</small></div><button className="icon-button" aria-label={`Remove enquiry from ${lead.name || lead.email || lead.phone}`} onClick={() => remove(lead.id)}><Trash2 size={17}/></button></article>)}</div> : <div className="card pad admin-empty-bookings"><h3>{leads.length ? 'No enquiries match your search.' : 'No popup enquiries yet.'}</h3><p className="muted">When a visitor shares a phone number or email, their details will appear here.</p></div>}
  </section>;
}
