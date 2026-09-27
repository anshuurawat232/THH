'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type GalleryPhoto = { src: string; alt: string; place: string; category: 'Trails' | 'Valleys' | 'Temples' };

const photos: GalleryPhoto[] = [
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/pexels-indu-bikash-sarker-116278202-29375782-scaled.jpg', alt: 'A high Himalayan mountain trail beneath snow-covered peaks', place: 'High Himalayan trail', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/pexels-gokul-gurang-224181659-15896015-scaled.jpg', alt: 'Trekkers walking through a dramatic mountain landscape', place: 'Mountain trail', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/pexels-shayantan-chanda-532646409-16786632-scaled.jpg', alt: 'A pilgrim route winding through the high Himalayas', place: 'Kedarnath Yatra', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/pexels-jinish-shah-398670867-30733489-scaled.jpg', alt: 'Snow peaks rising above a Himalayan valley', place: 'Garhwal Himalayas', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/pexels-rishu-bhosale-40372778-8343731-scaled.jpg', alt: 'A quiet mountain path surrounded by forest and peaks', place: 'Forest trail', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Harshil-Valley-nestled-in-the-lap-of-the-Garhwal%E2%80%A6-3.jpeg', alt: 'Harshil Valley nestled among the Garhwal Himalayan peaks', place: 'Harshil Valley', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Harshil-Valley-2.jpeg', alt: 'Mountain village and river scenery in Harshil Valley', place: 'Harshil Valley', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Harsil-Valley-_-Lama-Top-1.jpeg', alt: 'A high viewpoint above Harshil Valley', place: 'Lama Top', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Yamunotri-Temple-View.jpeg', alt: 'Yamunotri temple set in a dramatic mountain landscape', place: 'Yamunotri', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/IMG_20250318_150039007_HDR-1-scaled.jpg', alt: 'A winding trail through a remote Himalayan valley', place: 'Garhwal trail', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Gartang-Gali-1.jpeg', alt: 'Stone pathway along the historic Gartang Gali route', place: 'Gartang Gali', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/IMG_20250317_140334482-2-scaled.jpg', alt: 'A mountain ridge route with wide Himalayan views', place: 'Garhwal ridge', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/UttrakhandTungnath%F0%9F%94%B1-1.jpeg', alt: 'Tungnath temple beneath the peaks of Uttarakhand', place: 'Tungnath', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Tungnath-Chandrashila-trek-2.jpeg', alt: 'The route toward Tungnath and Chandrashila', place: 'Tungnath–Chandrashila', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Chopta-Mini-Switzerland-of-India-1.jpeg', alt: 'Green alpine meadows and ridges near Chopta', place: 'Chopta meadows', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Chandrashila-Peak-Chopta-Uttarakhand-1.jpeg', alt: 'A high summit view from Chandrashila in Uttarakhand', place: 'Chandrashila summit', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Kedarnath-temple.jpeg', alt: 'Kedarnath temple framed by Himalayan peaks', place: 'Kedarnath', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Madhyamaheshwar.jpeg', alt: 'Madhyamaheshwar temple and surrounding mountains', place: 'Madhyamaheshwar', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Kedarkantha-trek-1-1-scaled.jpg', alt: 'Snowy forest trail on the Kedarkantha trek', place: 'Kedarkantha', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Kedarkantha-Summit-scaled.jpg', alt: 'The open summit landscape of the Kedarkantha trek', place: 'Kedarkantha summit', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/kedarkantha-memories-1-scaled.jpg', alt: 'Trekkers enjoying a winter journey in the mountains', place: 'Kedarkantha winter trek', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Har-Ki-Dun-Trek-1-1.jpeg', alt: 'A trail crossing the beautiful Har Ki Dun valley', place: 'Har Ki Dun', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Har-ki-Dun-Valley-Uttarakhand-1.jpeg', alt: 'The broad mountain valley of Har Ki Dun', place: 'Har Ki Dun Valley', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/WhatsApp-Image-2025-04-12-at-21.13.25_df77e99e-scaled.jpg', alt: 'The open grassland and ridgelines of Dayara Bugyal', place: 'Dayara Bugyal', category: 'Valleys' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/WhatsApp-Image-2025-04-12-at-21.10.42_8a078d0a-scaled.jpg', alt: 'A trekker crossing the green alpine meadows of Dayara Bugyal', place: 'Dayara Bugyal trek', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/Gangotri-dham-%F0%9F%99%8F%F0%9F%8F%BB.jpeg', alt: 'Gangotri shrine in its Himalayan setting', place: 'Gangotri', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/badrinath-dham-2-1.jpeg', alt: 'Badrinath temple in the high mountains', place: 'Badrinath', category: 'Temples' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/05/WhatsApp-Image-2025-04-12-at-21.14.39_a9edb4cc-scaled.jpg', alt: 'A mountain campsite beneath the evening sky', place: 'Himalayan camp', category: 'Trails' },
  { src: 'https://thehimalayanhikes.com/wp-content/uploads/2025/04/hike-in-himalaya-BNZLZS5.jpg', alt: 'A hiker looking out across Himalayan peaks', place: 'Himalayan viewpoint', category: 'Trails' },
];

const filters = ['All moments', 'Trails', 'Valleys', 'Temples'] as const;
type Filter = typeof filters[number];

export default function GalleryPage() {
  const [filter, setFilter] = useState<Filter>('All moments');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const visiblePhotos = filter === 'All moments' ? photos : photos.filter(photo => photo.category === filter);
  const activePhoto = activeIndex === null ? null : visiblePhotos[activeIndex];

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowRight') setActiveIndex(index => index === null ? null : (index + 1) % visiblePhotos.length);
      if (event.key === 'ArrowLeft') setActiveIndex(index => index === null ? null : (index - 1 + visiblePhotos.length) % visiblePhotos.length);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [activeIndex, visiblePhotos.length]);

  return <>
    <section className="detail-hero gallery-hero"><div className="container"><span className="tag">Life on the trail</span><h1 className="title">The Himalayas, as we see them.</h1><p>Small moments, high ridgelines, quiet valleys and sacred places from journeys across Uttarakhand.</p></div></section>
    <section className="section gallery-section"><div className="container">
      <div className="gallery-intro"><div><span className="eyebrow">Field notes · 2025–26</span><h2 className="section-title">A little closer to the mountains.</h2></div><p className="muted">Browse the places and people that make every trek memorable.</p></div>
      <div className="gallery-filters" role="group" aria-label="Filter gallery by type">{filters.map(item=><button key={item} className={`gallery-filter ${filter===item?'active':''}`} aria-pressed={filter===item} onClick={()=>{setFilter(item);setActiveIndex(null);}}>{item}</button>)}</div>
      <div className="gallery-grid">{visiblePhotos.map((photo,index)=><button className="gallery-item" key={photo.src} onClick={()=>setActiveIndex(index)} aria-label={`View ${photo.place} photo`}><img src={photo.src} alt={photo.alt} loading={index<6?'eager':'lazy'}/><span className="gallery-item-shade"/><span className="gallery-item-caption"><small>{photo.category}</small><b>{photo.place}</b></span><span className="gallery-expand" aria-hidden="true">↗</span></button>)}</div>
      <div className="gallery-end-card"><span className="eyebrow">Find your own view</span><h2>Some places stay with you.</h2><p>Choose a trail and make a few mountain memories of your own.</p><a className="btn btn-primary" href="/treks">Explore treks</a></div>
    </div></section>
    {activePhoto&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`Photo of ${activePhoto.place}`} onClick={event=>{if(event.target===event.currentTarget)setActiveIndex(null);}}><button className="gallery-close" aria-label="Close gallery" onClick={()=>setActiveIndex(null)}><X/></button><button className="gallery-previous" aria-label="Previous image" onClick={()=>setActiveIndex(index=>index===null?null:(index-1+visiblePhotos.length)%visiblePhotos.length)}><ChevronLeft/></button><figure><img src={activePhoto.src} alt={activePhoto.alt}/><figcaption><span>{activePhoto.category}</span><b>{activePhoto.place}</b><small>{(activeIndex??0)+1} / {visiblePhotos.length}</small></figcaption></figure><button className="gallery-next" aria-label="Next image" onClick={()=>setActiveIndex(index=>index===null?null:(index+1)%visiblePhotos.length)}><ChevronRight/></button></div>}
  </>;
}
