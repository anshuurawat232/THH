# Himalayan Hikes

Advanced trekking/adventure travel website starter built with Next.js + TypeScript + React.

## Run in Codex

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Included
- Home, trek catalog and details, destinations, festivals, photo gallery, trek finder, planner, safety/about, stories, booking, account and offers admin
- 18 sample trek listings across India and Nepal
- Wishlist, planner and demo bookings stored in browser localStorage
- Trek image and discount controls, sitewide offers and coupon codes in `/admin`
- Booking invoice with print/save as PDF and optional email delivery
- Responsive layouts and reduced-motion support

## Email invoice setup
Invoice email delivery uses the Resend API. Configure these server-side environment variables:

```text
RESEND_API_KEY=your_resend_api_key
INVOICE_FROM_EMAIL=bookings@your-verified-domain.example
```

The sender address must be verified with Resend. Without these settings, bookings still show the invoice and allow printing or saving it as PDF, while the email button reports that delivery is not configured.

## Production work still needed
- Shared database storage for bookings, promotions and trek content
- Admin authentication and authorization
- Payment gateway and production booking confirmation
- Live weather, maps, and operational messaging integrations
