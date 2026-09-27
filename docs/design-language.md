# Bunks design language

Inspired by the warmth and restraint of Kindred; Bunks retains its own brand, property photography, and direct-booking model.

- Ivory (#f8f7f4) page canvas, oatmeal (#eeede7) secondary surfaces, charcoal (#252723) text and primary actions.
- DM Sans for navigation, forms and operational information. Lora at regular weight for editorial headlines and home names.
- 12px image and panel corners, pill buttons, subtle borders. Reserve floating shadows for overlays.
- Let photography lead. Home cards use open layouts; property pages use a five-image mosaic with a single-image mobile view.
- Keep controls at least 44px tall, preserve visible keyboard focus, label icon controls, and respect reduced motion.
- Reserve saturated status colors for feedback. Marketing may use muted blue, green, and yellow accents for guest stories and illustrations.

Runtime source of truth: `src/app/globals.css`. Exported palette: `tokens`. The root `design-system` file is a legacy, unmounted prototype, not the live component library.

Covered: homepage and destination filters, shared navigation/footer/buttons, property cards and details, booking summary/forms, trip lookup, guest messaging, about page. Shared typography and neutral tokens also flow through journal, guides, and operations screens.

## Reading hierarchy

Use serif for page titles and editorial moments; use 20px semibold sans-serif for property section headings. Property descriptions use 17px, weight 450, 1.65 line-height and a 65-character maximum measure. Reading copy uses primary charcoal; reserve secondary gray for metadata. Present narrative sections with simple dividers and highlights as open lists rather than repeated tinted cards.

## Marketing composition

The homepage leads with full-bleed Bunks photography, a centered two-line serif title, and one primary action. Its centered semibold navigation overlays the photograph and becomes opaque on scroll. Use white space between distinct sections: the real home collection, three benefits, alternating photography and copy, existing guest reviews, and a native disclosure FAQ. About follows the same typography and spacing with a centered introduction and an editorial story.

Keep marketing headings separate from operational property headings. Use the shared marketing container, section spacing, title, and button classes; avoid oversized italic headlines and repeated beige cards. All photographs are Bunks assets and guest quotations come from the existing property review data. Do not import Kindred membership, swapping, scale, or press claims into this direct-booking product.

## Site-wide interiors and operations

Use `page-title` for interior page titles, `reading-copy` for long-form prose, and `ops-surface` for compact administrative and housekeeping screens. Operational section headings stay semibold sans-serif; page titles stay regular serif. White forms sit on an ivory canvas with warm borders and restrained corners. Preserve semantic error/success colors; use charcoal for primary actions. Admin navigation is centered on wide screens and horizontally scrollable on phones, with `aria-current` identifying the active page.

The platform starts with two owned homes and is intended to onboard more. Write about repeat visits, hosts and homes guests know, and a growing collection. The approved savings claim is 10% less than the same home on other booking platforms. Do not name competitors in promotional copy. The homepage savings strip is a statement, not a link or button.

### Coverage map

| Page family | Shared implementation |
| --- | --- |
| Home, About, collection/filter views | Marketing layout, HomeView, AboutView |
| Journal and individual articles | JournalView, BlogPostView, reading-copy |
| Both property routes and property loading state | PropertyDetailView, Calendar, ImageLightbox, LoaderScreen |
| Guest details, payment, booking confirmation | BookingContainer, GuestDetailsForm, PaymentSection, BookingSummary, SuccessView |
| My trips, essential info, guide and inbox (including reference routes) | BookingDetailsView, MessagesWorkspace, BookingMessages |
| Public Steamboat guide | SteamboatGuestGuide |
| Wi-Fi connection and return-booking offer, light/dark variants | connect/[slug], WifiConnectForm |
| Privacy | Readable open sections; legal text unchanged |
| Host tax helper | TotToolLayout, TotWizard; calculations unchanged |
| Admin details, pricing, emails, resources, messages, guests | Admin layout, AdminTopNav, all six route views and admin components |
| Cleaner sign-in, properties, property checklists | Cleaner layouts, ChecklistViewer, ResourceList, LogoutButton |
| Missing routes | Branded not-found page |

### Verification boundaries

TypeScript and targeted lint validate the updated code. Browser checks cover public pages, trip lookup, Wi-Fi entry, cleaner sign-in, all six signed-in admin routes, and phone-width overflow on admin, privacy and the tax tool. Local admin data APIs can fail without a database; resource checklists and email previews use existing sample/static data. Populated pricing/guest/message data, cleaner-authenticated pages, payment completion and booked-trip states require their configured services or real sessions; their shared UI is updated but those end-to-end flows are not claimed as tested. Production was inspected read-only; no content, pricing, bookings or campaigns were changed.
