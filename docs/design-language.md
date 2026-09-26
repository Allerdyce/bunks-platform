# Bunks design language

Inspired by the warmth and restraint of Kindred; Bunks retains its own brand, property photography, and direct-booking model.

- Ivory (#f8f7f4) page canvas, oatmeal (#eeede7) secondary surfaces, charcoal (#252723) text and primary actions.
- DM Sans for navigation, forms and operational information. Lora at regular weight for editorial headlines and home names.
- 12px image and panel corners, pill buttons, subtle borders. Reserve floating shadows for overlays.
- Let photography lead. Home cards use open layouts; property pages use a five-image mosaic with a single-image mobile view.
- Keep controls at least 44px tall, preserve visible keyboard focus, label icon controls, and respect reduced motion.
- Use green, amber and red only where they communicate status. Avoid decorative status colors.

Runtime source of truth: `src/app/globals.css`. Exported palette: `tokens`. The root `design-system` file is a legacy, unmounted prototype, not the live component library.

Covered: homepage and destination filters, shared navigation/footer/buttons, property cards and details, booking summary/forms, trip lookup, guest messaging, about page. Shared typography and neutral tokens also flow through journal, guides, and operations screens.
