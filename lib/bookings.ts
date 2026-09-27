import { Trek } from './data';

export type StoredBooking = {
  id: string;
  trek: string;
  trekName: string;
  date: string;
  people: number;
  traveller: { name: string; email: string; phone: string };
  total: number;
  subtotal?: number;
  unitPrice?: number;
  offerPercent?: number;
  offerDiscount?: number;
  coupon?: string;
  couponDiscount?: number;
  discount?: number;
  createdAt: string;
  invoiceDate?: string;
  invoiceEmailStatus?: 'Sending' | 'Sent' | 'Failed';
  status: string;
  paymentStatus?: string;
  trekSnapshot?: Pick<Trek, 'region' | 'location' | 'days' | 'difficulty' | 'altitude' | 'distance' | 'season' | 'description' | 'highlights'>;
};

export const BOOKINGS_STORAGE_KEY = 'trailora-bookings';

export function readStoredBookings(value: unknown): StoredBooking[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item && typeof item === 'object' && typeof item.id === 'string').map(item => ({
    ...item,
    people: Math.max(1, Number(item.people) || 1),
    total: Math.max(0, Number(item.total) || 0),
    traveller: {
      name: String(item.traveller?.name || 'Trekker'),
      email: String(item.traveller?.email || ''),
      phone: String(item.traveller?.phone || ''),
    },
  }));
}
