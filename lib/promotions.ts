export type TrekCoupon = { code: string; type: 'percent' | 'fixed'; value: number; active: boolean };
export type PromotionSettings = { sitewidePercent: number; trekOffers: Record<string, number>; trekImages: Record<string, string>; coupons: TrekCoupon[] };

export const PROMOTION_STORAGE_KEY = 'the-himalayan-hikes-promotions';
export const DEFAULT_PROMOTIONS: PromotionSettings = {
  sitewidePercent: 0,
  trekOffers: { kedarkantha: 10 },
  trekImages: {},
  coupons: [{ code: 'WELCOME10', type: 'percent', value: 10, active: true }],
};

export function normalizePromotions(value: unknown): PromotionSettings {
  if (!value || typeof value !== 'object') return DEFAULT_PROMOTIONS;
  const data = value as Partial<PromotionSettings>;
  const offers = Object.fromEntries(Object.entries(data.trekOffers || {}).map(([slug, amount]) => [slug, Math.max(0, Math.min(90, Number(amount) || 0))]));
  const coupons = Array.isArray(data.coupons) ? data.coupons.filter(c => c && typeof c.code === 'string' && Number(c.value) > 0).map(c => ({
    code: c.code.trim().toUpperCase(), type: c.type === 'fixed' ? 'fixed' as const : 'percent' as const,
    value: Math.max(0, Math.min(c.type === 'fixed' ? 1000000 : 90, Number(c.value) || 0)), active: Boolean(c.active),
  })) : DEFAULT_PROMOTIONS.coupons;
  const images = Object.fromEntries(Object.entries(data.trekImages || {}).filter(([, url]) => typeof url === 'string').map(([slug, url]) => [slug, String(url).trim()]));
  return { sitewidePercent: Math.max(0, Math.min(90, Number(data.sitewidePercent) || 0)), trekOffers: offers, trekImages: images, coupons };
}

export function readPromotions(): PromotionSettings {
  try {
    const saved = localStorage.getItem(PROMOTION_STORAGE_KEY);
    return saved ? normalizePromotions(JSON.parse(saved)) : DEFAULT_PROMOTIONS;
  } catch { return DEFAULT_PROMOTIONS; }
}
