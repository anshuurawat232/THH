'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { Trek } from '../lib/data';
import { readPromotions } from '../lib/promotions';

export function TrekCard({ trek }: { trek: Trek }) {
  const [saved, setSaved] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('trailora-wishlist') || '[]');
      setSaved(Array.isArray(ids) && ids.includes(trek.id));
    } catch { setSaved(false); }
    const promotions = readPromotions();
    setDiscount(promotions.trekOffers[trek.slug] ?? promotions.sitewidePercent);
  }, [trek.id, trek.slug]);

  const toggle = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('trailora-wishlist') || '[]');
      const ids = Array.isArray(stored) ? stored : [];
      const next = ids.includes(trek.id) ? ids.filter((id: string) => id !== trek.id) : [...ids, trek.id];
      localStorage.setItem('trailora-wishlist', JSON.stringify(next));
      setSaved(next.includes(trek.id));
    } catch {
      localStorage.setItem('trailora-wishlist', JSON.stringify([trek.id]));
      setSaved(true);
    }
  };

  const discountedPrice = Math.round(trek.price * (1 - discount / 100));

  return <article className="card"><div className="trek-card-photo"><img className="trek-img" src={trek.image} alt={trek.name}/><button onClick={toggle} aria-label={saved ? 'Remove from wishlist' : `Save ${trek.name}`} aria-pressed={saved} title={saved ? 'Saved to wishlist' : 'Save trek'} className="trek-wishlist-button"><Heart size={18} fill={saved ? 'currentColor' : 'none'}/></button></div><div className="pad"><div className="row trek-card-pricing"><span className="tag">{trek.difficulty}</span>{discount > 0 ? <span className="trek-sale-price"><del>₹{trek.price.toLocaleString('en-IN')}</del><b className="price">₹{discountedPrice.toLocaleString('en-IN')}</b><small>{discount}% off</small></span> : <span className="price">₹{trek.price.toLocaleString('en-IN')}</span>}</div><h3 style={{margin:'14px 0 5px'}}>{trek.name}</h3><div className="muted" style={{fontSize:'.9rem'}}><MapPin size={14} style={{verticalAlign:'-2px'}}/> {trek.location}, {trek.region}</div><p className="muted">{trek.days} days · {trek.altitude} · {trek.distance}</p><div className="row"><Link className="btn btn-dark" href={`/treks/${trek.slug}`}>View Trek</Link><Link className="btn btn-outline" href={`/booking?trek=${trek.slug}`}>Check Dates</Link></div></div></article>;
}
