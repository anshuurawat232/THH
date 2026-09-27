'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BadgePercent, Check, Plus, Save, Trash2 } from 'lucide-react';
import { treks } from '../../lib/data';
import { DEFAULT_PROMOTIONS, normalizePromotions, PROMOTION_STORAGE_KEY, PromotionSettings } from '../../lib/promotions';
import { AdminBlogEditor } from '../../components/AdminBlogEditor';
import { AdminBookings } from '../../components/AdminBookings';
import { AdminVisitorLeads } from '../../components/AdminVisitorLeads';

export default function AdminPage() {
  const [settings, setSettings] = useState<PromotionSettings>(DEFAULT_PROMOTIONS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [trekSlug, setTrekSlug] = useState(treks[0].slug);
  const [imageTrek, setImageTrek] = useState(treks[0].slug);
  const [imageUrl, setImageUrl] = useState('');
  const [offerValue, setOfferValue] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'fixed'>('percent');
  const [couponValue, setCouponValue] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMOTION_STORAGE_KEY);
      if (raw) setSettings(normalizePromotions(JSON.parse(raw)));
    } catch { setSettings(DEFAULT_PROMOTIONS); }
    setLoaded(true);
  }, []);

  const save = () => {
    localStorage.setItem(PROMOTION_STORAGE_KEY, JSON.stringify(normalizePromotions(settings)));
    setSettings(normalizePromotions(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const addOffer = (event: FormEvent) => {
    event.preventDefault();
    const amount = Math.max(0, Math.min(90, Number(offerValue) || 0));
    setSettings(current => ({ ...current, trekOffers: { ...current.trekOffers, [trekSlug]: amount } }));
    setOfferValue('');
  };

  const addCoupon = (event: FormEvent) => {
    event.preventDefault();
    const code = couponCode.trim().toUpperCase().replace(/\s+/g, '');
    const value = Number(couponValue);
    if (!code || value <= 0) return;
    setSettings(current => ({ ...current, coupons: [...current.coupons.filter(c => c.code !== code), { code, type: couponType, value, active: true }] }));
    setCouponCode('');
    setCouponValue('');
  };

  if (!loaded) return <section className="section"><div className="container">Loading admin tools…</div></section>;

  return <section className="section admin-page"><div className="container">
    <div className="admin-heading"><div><span className="eyebrow">The Himalayan Hikes</span><h1 className="title">Website admin</h1><p className="muted">Manage enquiries, discounts, bookings, invoices and trek blog posts.</p></div><div className="admin-row-actions"><a className="btn btn-outline" href="#admin-visitor-leads">Enquiries</a><a className="btn btn-outline" href="#admin-bookings">Bookings</a><a className="btn btn-outline" href="#admin-blog-editor">Write a blog</a><button className="btn btn-dark" onClick={save}><Save size={17}/>{saved ? 'Saved' : 'Save changes'}</button></div></div>
    <div className="notice admin-storage-note">Changes are stored in this browser for this demo. A production site needs shared server storage and admin sign-in for changes to reach every customer.</div>

    <AdminVisitorLeads />
    <AdminBookings />

    <div className="grid admin-grid">
      <article className="card pad admin-panel"><span className="admin-icon"><BadgePercent size={20}/></span><h2>Sitewide offer</h2><p className="muted">Apply one percentage discount to every trek. A trek-specific offer replaces this value for that trek.</p><label className="field-label" htmlFor="sitewide-offer">Discount percentage</label><div className="admin-inline-field"><input id="sitewide-offer" className="field" type="number" min="0" max="90" value={settings.sitewidePercent} onChange={e=>setSettings({...settings,sitewidePercent:Number(e.target.value)})}/><span>%</span></div></article>

      <article className="card pad admin-panel"><span className="admin-icon"><Plus size={20}/></span><h2>Offer by trek</h2><p className="muted">Set a different percentage for a specific trip.</p><form onSubmit={addOffer} className="admin-form"><label className="field-label" htmlFor="offer-trek">Trek</label><select id="offer-trek" className="field" value={trekSlug} onChange={e=>setTrekSlug(e.target.value)}>{treks.map(t=><option value={t.slug} key={t.slug}>{t.name}</option>)}</select><label className="field-label" htmlFor="offer-value">Discount percentage</label><div className="admin-inline-field"><input id="offer-value" className="field" type="number" min="0" max="90" placeholder="e.g. 15" value={offerValue} onChange={e=>setOfferValue(e.target.value)}/><span>%</span></div><button className="btn btn-outline" type="submit">Add trek offer</button></form></article>

      <article className="card pad admin-panel"><span className="admin-icon"><Plus size={20}/></span><h2>Create a coupon</h2><p className="muted">Coupons can give a percentage or a fixed rupee discount per traveller.</p><form onSubmit={addCoupon} className="admin-form"><label className="field-label" htmlFor="coupon-code">Coupon code</label><input id="coupon-code" className="field" placeholder="e.g. SUMMIT15" value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())}/><div className="admin-coupon-fields"><label><span className="field-label">Discount type</span><select className="field" value={couponType} onChange={e=>setCouponType(e.target.value as 'percent'|'fixed')}><option value="percent">Percentage</option><option value="fixed">Fixed ₹ amount</option></select></label><label><span className="field-label">Value</span><input className="field" type="number" min="1" max={couponType==='percent'?90:1000000} value={couponValue} onChange={e=>setCouponValue(e.target.value)} placeholder={couponType==='percent'?'10':'500'}/></label></div><button className="btn btn-outline" type="submit">Add coupon</button></form></article>
    </div>

    <section className="card pad admin-image-panel"><div><span className="eyebrow">Trek gallery</span><h2>Update a trek image</h2><p className="muted">Paste an image URL to change the animated booking banner for that trek.</p></div><div className="admin-image-editor"><div><label className="field-label" htmlFor="image-trek">Trek</label><select id="image-trek" className="field" value={imageTrek} onChange={e=>{setImageTrek(e.target.value);setImageUrl(settings.trekImages[e.target.value]||'');}}>{treks.map(t=><option value={t.slug} key={t.slug}>{t.name}</option>)}</select><label className="field-label" htmlFor="trek-image-url">Image URL</label><input id="trek-image-url" className="field" type="url" placeholder="https://… (blank uses the current image)" value={imageUrl} onChange={e=>setImageUrl(e.target.value)}/><button className="btn btn-outline" style={{marginTop:14}} onClick={()=>setSettings({...settings,trekImages:{...settings.trekImages,[imageTrek]:imageUrl.trim()}})}>Set trek image</button></div><img className="admin-image-preview" src={imageUrl||treks.find(t=>t.slug===imageTrek)?.image} alt={`${treks.find(t=>t.slug===imageTrek)?.name} preview`}/></div></section>

    <div className="admin-lists"><section className="card pad"><div className="row"><div><span className="eyebrow">Active pricing</span><h2>Current trek offers</h2></div></div><div className="admin-list">{Object.entries(settings.trekOffers).map(([slug,value])=>{const trek=treks.find(t=>t.slug===slug);return <div className="admin-list-row" key={slug}><span><b>{trek?.name||slug}</b><small>{value}% off · customer sees this in booking</small></span><button className="icon-button" aria-label={`Remove ${trek?.name||slug} offer`} onClick={()=>setSettings({...settings,trekOffers:Object.fromEntries(Object.entries(settings.trekOffers).filter(([key])=>key!==slug))})}><Trash2 size={17}/></button></div>})}{settings.sitewidePercent>0&&<div className="admin-list-row"><span><b>All treks</b><small>{settings.sitewidePercent}% sitewide offer</small></span><span className="tag">Sitewide</span></div>}{settings.sitewidePercent===0&&!Object.keys(settings.trekOffers).length&&<p className="muted">No trek discounts are currently set.</p>}</div></section>
      <section className="card pad"><div className="row"><div><span className="eyebrow">Checkout codes</span><h2>Coupons</h2></div></div><div className="admin-list">{settings.coupons.map(coupon=><div className="admin-list-row" key={coupon.code}><span><b>{coupon.code}</b><small>{coupon.type==='percent'?`${coupon.value}% off`:`₹${coupon.value.toLocaleString('en-IN')} off per traveller`} · {coupon.active?'Active':'Paused'}</small></span><div className="admin-row-actions"><button className={`chip ${coupon.active?'active':''}`} onClick={()=>setSettings({...settings,coupons:settings.coupons.map(c=>c.code===coupon.code?{...c,active:!c.active}:c)})}>{coupon.active?'Active':'Paused'}</button><button className="icon-button" aria-label={`Delete ${coupon.code} coupon`} onClick={()=>setSettings({...settings,coupons:settings.coupons.filter(c=>c.code!==coupon.code)})}><Trash2 size={17}/></button></div></div>)}{!settings.coupons.length&&<p className="muted">No coupon codes. Add one above.</p>}</div></section></div>
    <div className="admin-save-bottom"><p className="muted">Offer or coupon edits are not live until you save.</p><button className="btn btn-dark" onClick={save}><Save size={17}/>{saved?<><Check size={17}/>Saved</>:'Save all changes'}</button></div>
    <AdminBlogEditor />
  </div></section>;
}
